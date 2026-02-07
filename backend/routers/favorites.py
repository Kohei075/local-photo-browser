from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.photo import Photo
from schemas.photo import FavoriteRequest, PhotoResponse
from routers.photos import photo_to_response

router = APIRouter()


@router.put("/photos/{photo_id}/favorite", response_model=PhotoResponse)
def toggle_favorite(photo_id: int, data: FavoriteRequest, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    photo.is_favorite = 1 if data.is_favorite else 0
    db.commit()
    db.refresh(photo)

    return photo_to_response(photo)
