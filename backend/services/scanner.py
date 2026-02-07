import os
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from models.photo import Photo
from services.exif import extract_exif_date, get_image_dimensions

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


def scan_folder(root_folder: str, extensions: set[str], db: Session):
    reset_status()
    scan_status["is_scanning"] = True

    try:
        if not os.path.isdir(root_folder):
            scan_status["error"] = f"Folder not found: {root_folder}"
            scan_status["is_scanning"] = False
            return

        # Collect all image files
        image_files: list[str] = []
        for dirpath, _, filenames in os.walk(root_folder):
            for fname in filenames:
                ext = os.path.splitext(fname)[1].lower().lstrip(".")
                if ext in extensions:
                    image_files.append(os.path.join(dirpath, fname))

        scan_status["total"] = len(image_files)

        # Track existing paths for deletion detection
        existing_paths = set()

        now = datetime.now().isoformat()

        for i, fpath in enumerate(image_files):
            fpath = os.path.normpath(fpath)
            scan_status["processed"] = i + 1
            scan_status["current_file"] = os.path.basename(fpath)

            existing_paths.add(fpath.lower())

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
                        existing.file_size = file_size
                        existing.modified_at = modified_at
                        width, height = get_image_dimensions(fpath)
                        existing.width = width
                        existing.height = height
                        existing.taken_at = extract_exif_date(fpath)
                        existing.scanned_at = now
                else:
                    # New photo
                    width, height = get_image_dimensions(fpath)
                    taken_at = extract_exif_date(fpath)
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

            except Exception:
                continue

        db.commit()

        # Remove photos whose files no longer exist
        all_photos = db.query(Photo).all()
        for photo in all_photos:
            if photo.file_path.lower() not in existing_paths:
                db.delete(photo)
        db.commit()

    except Exception as e:
        scan_status["error"] = str(e)
    finally:
        scan_status["is_scanning"] = False
