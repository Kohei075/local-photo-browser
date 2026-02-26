import os
import subprocess
import sys

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from models.photo import Photo
from models.setting import Setting
from services.thumbnail import generate_thumbnail
from services.pathutil import long_path

router = APIRouter()


@router.get("/images/{photo_id}/full")
def get_full_image(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    fpath = long_path(photo.file_path)
    if not os.path.isfile(fpath):
        raise HTTPException(status_code=404, detail="Image file not found on disk")

    media_type_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "gif": "image/gif",
        "bmp": "image/bmp",
        "tiff": "image/tiff",
        "tif": "image/tiff",
    }
    media_type = media_type_map.get(photo.extension, "image/jpeg")

    return FileResponse(
        fpath,
        media_type=media_type,
        headers={"Cache-Control": "no-cache"},
    )


@router.get("/images/{photo_id}/thumbnail")
def get_thumbnail(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    fpath = long_path(photo.file_path)
    if not os.path.isfile(fpath):
        raise HTTPException(status_code=404, detail="Image file not found on disk")

    # Get thumbnail size setting
    setting = db.query(Setting).filter(Setting.key == "thumbnail_size").first()
    max_size = int(setting.value) if setting else 300

    thumb_path = generate_thumbnail(photo.id, fpath, max_size)
    if not thumb_path or not os.path.isfile(thumb_path):
        raise HTTPException(status_code=500, detail="Failed to generate thumbnail")

    # Update photo thumbnail_path if not set
    if not photo.thumbnail_path:
        photo.thumbnail_path = thumb_path
        db.commit()

    return FileResponse(
        thumb_path,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-cache"},
    )


@router.post("/images/{photo_id}/reveal")
def reveal_in_explorer(photo_id: int, db: Session = Depends(get_db)):
    """Open the file's location in the OS file manager, selecting the file."""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    fpath = long_path(photo.file_path)
    if not os.path.isfile(fpath):
        raise HTTPException(status_code=404, detail="Image file not found on disk")

    if sys.platform == "win32":
        subprocess.Popen(["explorer", "/select,", os.path.normpath(fpath)])
    elif sys.platform == "darwin":
        subprocess.Popen(["open", "-R", fpath])
    else:
        folder = os.path.dirname(fpath)
        subprocess.Popen(["xdg-open", folder])

    return {"message": "OK"}
