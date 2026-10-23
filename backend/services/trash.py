import os
import sys

from services.pathutil import long_path


def move_to_trash(file_path: str) -> None:
    """Move one file to the OS trash; never fall back to unlinking the original."""
    if not os.path.isfile(long_path(file_path)):
        raise FileNotFoundError(file_path)

    if sys.platform == "win32":
        # Require IFileOperation and its recycle flags instead of the legacy
        # SHFileOperation fallback. nativeLib installs the required pywin32.
        from send2trash.win.modern import send2trash
    else:
        from send2trash import send2trash

    send2trash(os.path.abspath(file_path))
    # Some shell operations can be skipped without raising an exception.
    if os.path.lexists(long_path(file_path)):
        raise OSError("The file could not be moved to the trash")
