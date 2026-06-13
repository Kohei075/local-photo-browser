import os
import re
import sys
import logging
import subprocess
from typing import Optional

from config import THUMBNAIL_DIR

logger = logging.getLogger(__name__)

_ffmpeg_exe: Optional[str] = None
_ffmpeg_resolved = False

# Windows: prevent a console window from flashing for each ffmpeg call.
_NO_WINDOW = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0

_DURATION_RE = re.compile(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)")
_RESOLUTION_RE = re.compile(r"\b(\d{2,5})x(\d{2,5})\b")


def get_ffmpeg() -> Optional[str]:
    """Return the path to a usable ffmpeg binary, or None if unavailable."""
    global _ffmpeg_exe, _ffmpeg_resolved
    if _ffmpeg_resolved:
        return _ffmpeg_exe
    _ffmpeg_resolved = True
    try:
        import imageio_ffmpeg
        _ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as e:
        logger.warning("ffmpeg unavailable, video thumbnails/duration disabled: %s", e)
        _ffmpeg_exe = None
    return _ffmpeg_exe


def _run_ffmpeg(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        args,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        creationflags=_NO_WINDOW,
    )


def probe_video(file_path: str) -> tuple[Optional[int], Optional[int], Optional[float]]:
    """Return (width, height, duration_seconds) for a video, best-effort.

    Any field may be None if it cannot be determined.
    """
    ffmpeg = get_ffmpeg()
    if not ffmpeg:
        return None, None, None

    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None

    try:
        # ffmpeg with no output exits non-zero but prints stream info to stderr.
        proc = _run_ffmpeg([ffmpeg, "-hide_banner", "-i", file_path])
        text = proc.stderr.decode("utf-8", errors="replace")

        m = _DURATION_RE.search(text)
        if m:
            h, mnt, sec = m.groups()
            duration = int(h) * 3600 + int(mnt) * 60 + float(sec)

        for line in text.splitlines():
            if " Video: " in line:
                rm = _RESOLUTION_RE.search(line)
                if rm:
                    width, height = int(rm.group(1)), int(rm.group(2))
                break
    except Exception as e:
        logger.warning("Failed to probe video %s: %s", file_path, e)

    return width, height, duration


def generate_video_thumbnail(photo_id: int, file_path: str, max_size: int = 300,
                             seek: float = 1.0) -> str:
    """Extract a single poster frame and cache it as a JPEG thumbnail.

    Returns the thumbnail path, or "" on failure.
    """
    ffmpeg = get_ffmpeg()
    if not ffmpeg:
        return ""

    thumb_path = os.path.join(THUMBNAIL_DIR, f"{photo_id}.jpg")
    if os.path.exists(thumb_path):
        return thumb_path

    # Fit the frame within a max_size box while preserving aspect ratio.
    vf = f"scale='min({max_size},iw)':'min({max_size},ih)':force_original_aspect_ratio=decrease"

    # Try seeking a little into the clip first (avoids black intro frames);
    # fall back to the very first frame for very short clips.
    for ss in (seek, 0.0):
        args = [
            ffmpeg, "-y", "-hide_banner",
            "-ss", str(ss),
            "-i", file_path,
            "-frames:v", "1",
            "-vf", vf,
            "-q:v", "3",
            thumb_path,
        ]
        try:
            _run_ffmpeg(args)
        except Exception as e:
            logger.warning("Failed to run ffmpeg for video %d (%s): %s", photo_id, file_path, e)
            return ""
        if os.path.isfile(thumb_path) and os.path.getsize(thumb_path) > 0:
            return thumb_path

    logger.warning("Failed to extract poster frame for video %d (%s)", photo_id, file_path)
    return ""
