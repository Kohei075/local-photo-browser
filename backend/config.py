import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
THUMBNAIL_DIR = os.path.join(DATA_DIR, "thumbnails")
DB_PATH = os.path.join(DATA_DIR, "app.db")
DB_URL = f"sqlite:///{DB_PATH}"

IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
# Browser-natively playable video containers (no transcoding required).
# Note: actual playback still depends on the codec inside the container.
VIDEO_EXTENSIONS = {"mp4", "webm", "ogg", "ogv", "mov", "m4v"}
SUPPORTED_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS


def is_video_extension(ext: str) -> bool:
    return ext.lower().lstrip(".") in VIDEO_EXTENSIONS

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(THUMBNAIL_DIR, exist_ok=True)
