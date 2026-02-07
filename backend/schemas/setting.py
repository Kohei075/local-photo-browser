from pydantic import BaseModel
from typing import Optional


class SettingsResponse(BaseModel):
    root_folder: str = ""
    extensions: str = "jpg,jpeg,png,webp"
    slideshow_interval: str = "5"
    thumbnail_size: str = "300"


class SettingsUpdate(BaseModel):
    root_folder: Optional[str] = None
    extensions: Optional[str] = None
    slideshow_interval: Optional[str] = None
    thumbnail_size: Optional[str] = None
