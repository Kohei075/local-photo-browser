import os
import subprocess
import sys

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import is_video_extension
from database import get_db
from models.photo import Photo
from models.setting import Setting
from services.thumbnail import generate_thumbnail
from services.video import generate_video_thumbnail
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
        "mp4": "video/mp4",
        "m4v": "video/mp4",
        "webm": "video/webm",
        "ogg": "video/ogg",
        "ogv": "video/ogg",
        "mov": "video/quicktime",
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

    if is_video_extension(photo.extension):
        # Poster frame via ffmpeg (uses the clean path; ffmpeg dislikes \\?\ prefixes).
        thumb_path = generate_video_thumbnail(photo.id, photo.file_path, max_size)
    else:
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


class ScreenshotRequest(BaseModel):
    image: str  # PNG data URL (data:image/png;base64,...) or raw base64


@router.post("/screenshot")
def take_screenshot(req: ScreenshotRequest, db: Session = Depends(get_db)):
    """Save a client-captured PNG to the configured screenshot folder."""
    import base64
    from datetime import datetime

    setting = db.query(Setting).filter(Setting.key == "screenshot_folder").first()
    folder = (setting.value if setting else "").strip()
    if not folder:
        raise HTTPException(status_code=400, detail="screenshot_folder_not_set")
    if not os.path.isdir(folder):
        raise HTTPException(status_code=400, detail="screenshot_folder_not_found")

    data = req.image
    if "," in data:
        data = data.split(",", 1)[1]
    try:
        raw = base64.b64decode(data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data")

    file_name = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    save_path = os.path.join(folder, file_name)
    try:
        with open(save_path, "wb") as f:
            f.write(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save screenshot: {e}")

    return {"saved": True, "path": save_path, "file_name": file_name}
