from pydantic import BaseModel
from typing import Optional


class PhotoResponse(BaseModel):
    id: int
    file_path: str
    file_name: str
    extension: str
    file_size: int
    width: Optional[int] = None
    height: Optional[int] = None
    created_at: str
    modified_at: str
    taken_at: Optional[str] = None
    is_favorite: bool
    thumbnail_url: str

    model_config = {"from_attributes": True}


class PhotoListResponse(BaseModel):
    items: list[PhotoResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class NeighborsResponse(BaseModel):
    prev_id: Optional[int] = None
    next_id: Optional[int] = None


class FavoriteRequest(BaseModel):
    is_favorite: bool
