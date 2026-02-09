import os
import sys

# \\?\ prefix for Windows long path support (4 chars)
_WIN_LONG_PREFIX = r"\\?\ "[:-1]  # r"\\?\ " minus trailing space = \\?\


def long_path(path: str) -> str:
    """On Windows, prefix path with \\\\?\\ to support paths longer than 260 chars."""
    if sys.platform == "win32" and not path.startswith(_WIN_LONG_PREFIX):
        return _WIN_LONG_PREFIX + os.path.abspath(path)
    return path


def clean_path(path: str) -> str:
    """Remove the \\\\?\\ prefix if present."""
    if path.startswith(_WIN_LONG_PREFIX):
        return path[len(_WIN_LONG_PREFIX):]
    return path
