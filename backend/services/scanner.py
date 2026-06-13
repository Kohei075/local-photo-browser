import os
import sys
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from config import is_video_extension
from models.photo import Photo
from services.exif import extract_image_info
from services.video import probe_video

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

        # Pre-build lookup of existing DB records: {normcase_path: (modified_at, file_size, id, duration)}
        all_db_photos = db.query(
            Photo.id, Photo.file_path, Photo.modified_at, Photo.file_size, Photo.duration
        ).all()
        db_lookup: dict[str, tuple[str, int, int, float | None]] = {}
        for pid, fp, mat, fsz, dur in all_db_photos:
            norm = os.path.normcase(fp)
            if _is_in_target(norm):
                db_lookup[norm] = (mat, fsz, pid, dur)

        # Collect all image files (use long path prefix for Windows long filename support)
        image_files: list[str] = []

        def _walk_error(err: OSError):
            logger.warning("Cannot access directory: %s", err)

        def _filter_and_collect(walker):
            for dirpath, dirnames, filenames in walker:
                try:
                    dirnames[:] = [
                        d for d in dirnames
                        if os.path.normcase(os.path.normpath(
                            clean_path(os.path.join(dirpath, d))
                        ))
                        not in excluded_normalized
                    ]
                except Exception as e:
                    logger.warning("Error filtering dirs in %s: %s", dirpath, e)
                for fname in filenames:
                    if fname.startswith("._"):
                        continue
                    ext = os.path.splitext(fname)[1].lower().lstrip(".")
                    if ext in extensions:
                        image_files.append(os.path.join(dirpath, fname))

        if target_prefixes is not None:
            # Walk only the specified target folders
            for tf in target_folders:
                long_tf = long_path(tf)
                if not os.path.isdir(long_tf):
                    continue
                _filter_and_collect(os.walk(long_tf, onerror=_walk_error))
        else:
            # Full scan: walk the entire root
            _filter_and_collect(os.walk(long_root, onerror=_walk_error))

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

            fname = os.path.basename(fpath)
            ext = os.path.splitext(fname)[1].lower().lstrip(".")
            is_video = is_video_extension(ext)

            try:
                stat = os.stat(fpath)
                file_size = stat.st_size
                modified_at = datetime.fromtimestamp(stat.st_mtime).isoformat()

                cached = db_lookup.get(norm_key)

                if cached:
                    cached_mat, cached_fsz, cached_id, cached_dur = cached
                    # Re-probe videos that are missing duration (e.g. scanned before
                    # video metadata support existed), even if otherwise unchanged.
                    metadata_complete = (not is_video) or (cached_dur is not None)
                    if cached_mat == modified_at and cached_fsz == file_size and metadata_complete:
                        # Unchanged — skip entirely (no DB query needed)
                        unchanged += 1
                        continue

                # Extract metadata (only for new or modified files).
                # Videos can't be opened by Pillow — probe with ffmpeg instead.
                if is_video:
                    width, height, duration = probe_video(fpath)
                    taken_at = None
                else:
                    width, height, taken_at = extract_image_info(fpath)
                    duration = None

                if cached:
                    # Modified — update existing record.
                    db.query(Photo).filter(Photo.id == cached_id).update({
                        "file_size": file_size,
                        "modified_at": modified_at,
                        "width": width,
                        "height": height,
                        "duration": duration,
                        "taken_at": taken_at,
                        "scanned_at": now,
                    })
                else:
                    # New photo
                    created_at = datetime.fromtimestamp(stat.st_ctime).isoformat()

                    photo = Photo(
                        file_path=db_path,
                        file_name=fname,
                        extension=ext,
                        file_size=file_size,
                        width=width,
                        height=height,
                        duration=duration,
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
                    try:
                        db.commit()
                    except Exception as e:
                        logger.warning("Batch commit failed at %d, rolling back: %s", i + 1, e)
                        db.rollback()

            except Exception as e:
                skipped += 1
                logger.warning("Skipped %s: %s", fpath, e)
                try:
                    db.rollback()
                except Exception:
                    pass
                continue

        try:
            db.commit()
        except Exception as e:
            logger.warning("Final commit failed, rolling back: %s", e)
            db.rollback()

        # Remove photos whose files no longer exist on disk
        # When target_folders is set, only consider photos within those folders
        removed_ids = [
            pid for norm_path, (_, _, pid, _) in db_lookup.items()
            if norm_path not in existing_paths and _is_in_target(norm_path)
        ]
        if removed_ids:
            try:
                db.query(Photo).filter(Photo.id.in_(removed_ids)).delete(synchronize_session=False)
                db.commit()
            except Exception as e:
                logger.warning("Failed to remove deleted photos: %s", e)
                db.rollback()

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
