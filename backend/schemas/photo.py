from pydantic import BaseModel, Field
from typing import Annotated, Literal, Optional


class PhotoResponse(BaseModel):
    id: int
    file_path: str
    file_name: str
    extension: str
    file_size: int
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
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


class TrashPhotosRequest(BaseModel):
    photo_ids: list[Annotated[int, Field(strict=True, gt=0)]] = Field(min_length=1)


class TrashPhotoFailure(BaseModel):
    id: int
    file_name: str
    reason: Literal["not_found", "trash_failed"]


class TrashPhotosResponse(BaseModel):
    deleted_ids: list[int]
    failed: list[TrashPhotoFailure]
