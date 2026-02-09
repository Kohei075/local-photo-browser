import os
import logging
from PIL import Image

from config import THUMBNAIL_DIR
from services.pathutil import long_path

logger = logging.getLogger(__name__)


def generate_thumbnail(photo_id: int, file_path: str, max_size: int = 300) -> str:
    thumb_path = os.path.join(THUMBNAIL_DIR, f"{photo_id}.jpg")

    if os.path.exists(thumb_path):
        return thumb_path

    try:
        with Image.open(long_path(file_path)) as img:
            # Handle animated images (GIF) - use first frame
            if hasattr(img, "n_frames") and img.n_frames > 1:
                img.seek(0)

            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

            # Convert to RGB for JPEG compatibility
            if img.mode not in ("RGB",):
                img = img.convert("RGB")

            img.save(thumb_path, "JPEG", quality=85)
    except Exception as e:
        logger.warning("Failed to generate thumbnail for photo %d (%s): %s", photo_id, file_path, e)
        return ""

    return thumb_path
