import logging
from PIL import Image
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


def extract_image_info(file_path: str) -> tuple[Optional[int], Optional[int], Optional[str]]:
    """Open the image once and return (width, height, taken_at).

    Returns (None, None, None) if the file cannot be opened at all.
    Dimensions may succeed even if EXIF fails, and vice versa.
    """
    width: Optional[int] = None
    height: Optional[int] = None
    taken_at: Optional[str] = None

    try:
        with Image.open(file_path) as img:
            try:
                width, height = img.size
            except Exception as e:
                logger.warning("Failed to get dimensions for %s: %s", file_path, e)

            try:
                exif_data = img.getexif()
                if exif_data:
                    # DateTimeOriginal (36867) or DateTime (306)
                    date_str = exif_data.get(36867) or exif_data.get(306)
                    if date_str:
                        dt = datetime.strptime(date_str, "%Y:%m:%d %H:%M:%S")
                        taken_at = dt.isoformat()
            except Exception as e:
                logger.warning("Failed to extract EXIF for %s: %s", file_path, e)
    except Exception as e:
        logger.warning("Failed to open image %s: %s", file_path, e)

    return width, height, taken_at


# Keep old functions for backward compatibility (used by thumbnail etc.)
def extract_exif_date(file_path: str) -> Optional[str]:
    _, _, taken_at = extract_image_info(file_path)
    return taken_at


def get_image_dimensions(file_path: str) -> tuple[Optional[int], Optional[int]]:
    w, h, _ = extract_image_info(file_path)
    return w, h
