import os
from PIL import Image

from config import THUMBNAIL_DIR


def generate_thumbnail(photo_id: int, file_path: str, max_size: int = 300) -> str:
    thumb_path = os.path.join(THUMBNAIL_DIR, f"{photo_id}.jpg")

    if os.path.exists(thumb_path):
        return thumb_path

    try:
        with Image.open(file_path) as img:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            img.save(thumb_path, "JPEG", quality=85)
    except Exception:
        return ""

    return thumb_path
