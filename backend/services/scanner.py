import os
import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from models.photo import Photo
from services.exif import extract_image_info

logger = logging.getLogger(__name__)

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
                excluded_folders: set[str] | None = None):
    reset_status()
    scan_status["is_scanning"] = True

    excluded_normalized = {
        os.path.normcase(os.path.normpath(f)) for f in (excluded_folders or set())
    }

    try:
        if not os.path.isdir(root_folder):
            scan_status["error"] = f"Folder not found: {root_folder}"
            scan_status["is_scanning"] = False
            return

        # Collect all image files
        image_files: list[str] = []
        for dirpath, dirnames, filenames in os.walk(root_folder):
            # Skip excluded directories
            dirnames[:] = [
                d for d in dirnames
                if os.path.normcase(os.path.normpath(os.path.join(dirpath, d)))
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

        for i, fpath in enumerate(image_files):
            fpath = os.path.normpath(fpath)
            scan_status["processed"] = i + 1
            scan_status["current_file"] = os.path.basename(fpath)

            existing_paths.add(os.path.normcase(fpath))

            try:
                stat = os.stat(fpath)
                file_size = stat.st_size
                created_at = datetime.fromtimestamp(stat.st_ctime).isoformat()
                modified_at = datetime.fromtimestamp(stat.st_mtime).isoformat()

                # Check if photo already exists
                existing = db.query(Photo).filter(
                    Photo.file_path == fpath
                ).first()

                if existing:
                    # Update if file was modified
                    if existing.modified_at != modified_at or existing.file_size != file_size:
                        width, height, taken_at = extract_image_info(fpath)
                        existing.file_size = file_size
                        existing.modified_at = modified_at
                        existing.width = width
                        existing.height = height
                        existing.taken_at = taken_at
                        existing.scanned_at = now
                else:
                    # New photo - open file once for dimensions + EXIF
                    width, height, taken_at = extract_image_info(fpath)
                    fname = os.path.basename(fpath)
                    ext = os.path.splitext(fname)[1].lower().lstrip(".")

                    photo = Photo(
                        file_path=fpath,
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

        # Remove photos whose files no longer exist
        all_photos = db.query(Photo).all()
        removed = 0
        for photo in all_photos:
            if os.path.normcase(photo.file_path) not in existing_paths:
                db.delete(photo)
                removed += 1
        if removed:
            db.commit()

        logger.info("Scan complete: %d processed, %d skipped, %d removed",
                     len(image_files) - skipped, skipped, removed)

    except Exception as e:
        scan_status["error"] = str(e)
        logger.error("Scan failed: %s", e)
    finally:
        scan_status["is_scanning"] = False
