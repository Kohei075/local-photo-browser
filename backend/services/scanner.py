import os
import sys
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from models.photo import Photo
from services.exif import extract_image_info

logger = logging.getLogger(__name__)


from services.pathutil import long_path, clean_path

scan_status = {
    "is_scanning": False,
    "total": 0,
    "processed": 0,
    "current_file": "",
    "error": None,
}


def reset_status():
    scan_status["is_scanning"] = False
    scan_status["total"] = 0
    scan_status["processed"] = 0
    scan_status["current_file"] = ""
    scan_status["error"] = None


def scan_folder(root_folder: str, extensions: set[str], db: Session,
                excluded_folders: set[str] | None = None,
                target_folders: list[str] | None = None):
    reset_status()
    scan_status["is_scanning"] = True

    excluded_normalized = {
        os.path.normcase(os.path.normpath(f)) for f in (excluded_folders or set())
    }

    # Normalize target folders for prefix matching
    target_prefixes: list[str] | None = None
    if target_folders is not None:
        target_prefixes = [
            os.path.normcase(os.path.normpath(f)) for f in target_folders
        ]

    def _is_in_target(normcase_path: str) -> bool:
        """Check if a path falls within any of the target folders."""
        if target_prefixes is None:
            return True
        for prefix in target_prefixes:
            if normcase_path == prefix or normcase_path.startswith(prefix + os.sep):
                return True
        return False

    try:
        long_root = long_path(root_folder)
        if not os.path.isdir(long_root):
            scan_status["error"] = f"Folder not found: {root_folder}"
            scan_status["is_scanning"] = False
            return

        # Pre-build lookup of existing DB records: {normcase_path: (modified_at, file_size, id)}
        all_db_photos = db.query(Photo.id, Photo.file_path, Photo.modified_at, Photo.file_size).all()
        db_lookup: dict[str, tuple[str, int, int]] = {}
        for pid, fp, mat, fsz in all_db_photos:
            norm = os.path.normcase(fp)
            if _is_in_target(norm):
                db_lookup[norm] = (mat, fsz, pid)

        # Collect all image files (use long path prefix for Windows long filename support)
        image_files: list[str] = []

        if target_prefixes is not None:
            # Walk only the specified target folders
            for tf in target_folders:
                long_tf = long_path(tf)
                if not os.path.isdir(long_tf):
                    continue
                for dirpath, dirnames, filenames in os.walk(long_tf):
                    dirnames[:] = [
                        d for d in dirnames
                        if os.path.normcase(os.path.normpath(
                            clean_path(os.path.join(dirpath, d))
                        ))
                        not in excluded_normalized
                    ]
                    for fname in filenames:
                        ext = os.path.splitext(fname)[1].lower().lstrip(".")
                        if ext in extensions:
                            image_files.append(os.path.join(dirpath, fname))
        else:
            # Full scan: walk the entire root
            for dirpath, dirnames, filenames in os.walk(long_root):
                # Skip excluded directories
                dirnames[:] = [
                    d for d in dirnames
                    if os.path.normcase(os.path.normpath(
                        clean_path(os.path.join(dirpath, d))
                    ))
                    not in excluded_normalized
                ]
                for fname in filenames:
                    ext = os.path.splitext(fname)[1].lower().lstrip(".")
                    if ext in extensions:
                        image_files.append(os.path.join(dirpath, fname))

        scan_status["total"] = len(image_files)
        logger.info("Scan started: %d files found in %s", len(image_files), root_folder)

        # Track existing paths for deletion detection
        existing_paths = set()

        now = datetime.now().isoformat()
        skipped = 0
        unchanged = 0

        for i, fpath in enumerate(image_files):
            fpath = os.path.normpath(fpath)
            # Store clean path (without \\?\ prefix) in DB
            db_path = clean_path(fpath)
            scan_status["processed"] = i + 1
            scan_status["current_file"] = os.path.basename(fpath)

            norm_key = os.path.normcase(db_path)
            existing_paths.add(norm_key)

            try:
                stat = os.stat(fpath)
                file_size = stat.st_size
                modified_at = datetime.fromtimestamp(stat.st_mtime).isoformat()

                cached = db_lookup.get(norm_key)

                if cached:
                    cached_mat, cached_fsz, cached_id = cached
                    if cached_mat == modified_at and cached_fsz == file_size:
                        # Unchanged — skip entirely (no DB query needed)
                        unchanged += 1
                        continue
                    # Modified — update existing record
                    width, height, taken_at = extract_image_info(fpath)
                    db.query(Photo).filter(Photo.id == cached_id).update({
                        "file_size": file_size,
                        "modified_at": modified_at,
                        "width": width,
                        "height": height,
                        "taken_at": taken_at,
                        "scanned_at": now,
                    })
                else:
                    # New photo
                    created_at = datetime.fromtimestamp(stat.st_ctime).isoformat()
                    width, height, taken_at = extract_image_info(fpath)
                    fname = os.path.basename(fpath)
                    ext = os.path.splitext(fname)[1].lower().lstrip(".")

                    photo = Photo(
                        file_path=db_path,
                        file_name=fname,
                        extension=ext,
                        file_size=file_size,
                        width=width,
                        height=height,
                        created_at=created_at,
                        modified_at=modified_at,
                        taken_at=taken_at,
                        is_favorite=0,
                        thumbnail_path=None,
                        scanned_at=now,
                    )
                    db.add(photo)

                # Commit in batches
                if (i + 1) % 100 == 0:
                    db.commit()

            except Exception as e:
                skipped += 1
                logger.warning("Skipped %s: %s", fpath, e)
                continue

        db.commit()

        # Remove photos whose files no longer exist on disk
        # When target_folders is set, only consider photos within those folders
        removed_ids = [
            pid for norm_path, (_, _, pid) in db_lookup.items()
            if norm_path not in existing_paths and _is_in_target(norm_path)
        ]
        if removed_ids:
            db.query(Photo).filter(Photo.id.in_(removed_ids)).delete(synchronize_session=False)
            db.commit()

        logger.info(
            "Scan complete: %d total, %d unchanged, %d new/updated, %d skipped, %d removed",
            len(image_files), unchanged,
            len(image_files) - unchanged - skipped, skipped, len(removed_ids),
        )

    except Exception as e:
        scan_status["error"] = str(e)
        logger.error("Scan failed: %s", e)
    finally:
        scan_status["is_scanning"] = False
