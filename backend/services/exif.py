from PIL import Image
from PIL.ExifTags import Base as ExifBase
from typing import Optional
from datetime import datetime


def extract_exif_date(file_path: str) -> Optional[str]:
    try:
        with Image.open(file_path) as img:
            exif_data = img.getexif()
            if not exif_data:
                return None
            # DateTimeOriginal (36867) or DateTime (306)
            date_str = exif_data.get(36867) or exif_data.get(306)
            if date_str:
                dt = datetime.strptime(date_str, "%Y:%m:%d %H:%M:%S")
                return dt.isoformat()
    except Exception:
        pass
    return None


def get_image_dimensions(file_path: str) -> tuple[Optional[int], Optional[int]]:
    try:
        with Image.open(file_path) as img:
            return img.size
    except Exception:
        return None, None
