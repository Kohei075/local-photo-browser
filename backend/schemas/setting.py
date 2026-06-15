from pydantic import BaseModel
from typing import Optional


class SettingsResponse(BaseModel):
    root_folder: str = ""
    extensions: str = "jpg,jpeg,png,webp"
    thumbnail_size: str = "300"
    screenshot_folder: str = ""


class SettingsUpdate(BaseModel):
    root_folder: Optional[str] = None
    extensions: Optional[str] = None
    thumbnail_size: Optional[str] = None
    screenshot_folder: Optional[str] = None


class ExcludedFoldersResponse(BaseModel):
    excluded_folders: list[str] = []


class ExcludedFoldersUpdate(BaseModel):
    excluded_folders: list[str] = []
