from pydantic import BaseModel

from schemas.photo import PhotoResponse


class CombinationCreate(BaseModel):
    photo_ids: list[int]


class CombinationResponse(BaseModel):
    id: int
    created_at: str
    photos: list[PhotoResponse]
