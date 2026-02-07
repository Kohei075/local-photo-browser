from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.person_tag import PersonTag
from models.photo_person import PhotoPerson
from models.photo import Photo
from schemas.person_tag import PersonTagCreate, PersonTagUpdate, PersonTagResponse, PhotoTagRequest

router = APIRouter()


@router.get("/tags", response_model=list[PersonTagResponse])
def get_tags(db: Session = Depends(get_db)):
    tags = db.query(PersonTag).all()
    result = []
    for tag in tags:
        count = db.query(PhotoPerson).filter(PhotoPerson.person_tag_id == tag.id).count()
        result.append(PersonTagResponse(
            id=tag.id,
            name=tag.name,
            created_at=tag.created_at,
            photo_count=count,
        ))
    return result


@router.post("/tags", response_model=PersonTagResponse)
def create_tag(data: PersonTagCreate, db: Session = Depends(get_db)):
    existing = db.query(PersonTag).filter(PersonTag.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag with this name already exists")

    tag = PersonTag(name=data.name, created_at=datetime.now().isoformat())
    db.add(tag)
    db.commit()
    db.refresh(tag)

    return PersonTagResponse(id=tag.id, name=tag.name, created_at=tag.created_at, photo_count=0)


@router.put("/tags/{tag_id}", response_model=PersonTagResponse)
def update_tag(tag_id: int, data: PersonTagUpdate, db: Session = Depends(get_db)):
    tag = db.query(PersonTag).filter(PersonTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    existing = db.query(PersonTag).filter(PersonTag.name == data.name, PersonTag.id != tag_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag with this name already exists")

    tag.name = data.name
    db.commit()
    db.refresh(tag)

    count = db.query(PhotoPerson).filter(PhotoPerson.person_tag_id == tag.id).count()
    return PersonTagResponse(id=tag.id, name=tag.name, created_at=tag.created_at, photo_count=count)


@router.delete("/tags/{tag_id}")
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(PersonTag).filter(PersonTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    db.query(PhotoPerson).filter(PhotoPerson.person_tag_id == tag_id).delete()
    db.delete(tag)
    db.commit()
    return {"message": "Tag deleted"}


@router.post("/photos/{photo_id}/tags")
def add_tag_to_photo(photo_id: int, data: PhotoTagRequest, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    tag = db.query(PersonTag).filter(PersonTag.id == data.person_tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    existing = db.query(PhotoPerson).filter(
        PhotoPerson.photo_id == photo_id,
        PhotoPerson.person_tag_id == data.person_tag_id,
    ).first()
    if existing:
        return {"message": "Tag already assigned"}

    db.add(PhotoPerson(photo_id=photo_id, person_tag_id=data.person_tag_id))
    db.commit()
    return {"message": "Tag added"}


@router.delete("/photos/{photo_id}/tags/{tag_id}")
def remove_tag_from_photo(photo_id: int, tag_id: int, db: Session = Depends(get_db)):
    link = db.query(PhotoPerson).filter(
        PhotoPerson.photo_id == photo_id,
        PhotoPerson.person_tag_id == tag_id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Tag assignment not found")

    db.delete(link)
    db.commit()
    return {"message": "Tag removed"}
