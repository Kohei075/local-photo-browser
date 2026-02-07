from pydantic import BaseModel


class PersonTagCreate(BaseModel):
    name: str


class PersonTagUpdate(BaseModel):
    name: str


class PersonTagResponse(BaseModel):
    id: int
    name: str
    created_at: str
    photo_count: int = 0

    model_config = {"from_attributes": True}


class PhotoTagRequest(BaseModel):
    person_tag_id: int
