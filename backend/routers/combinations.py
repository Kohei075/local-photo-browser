import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.photo import Photo
from models.favorite_combination import FavoriteCombination
from schemas.combination import CombinationCreate, CombinationResponse
from routers.photos import photo_to_response

router = APIRouter()


def _to_response(combo: FavoriteCombination, db: Session) -> CombinationResponse:
    try:
        ids = json.loads(combo.photo_ids)
    except (ValueError, TypeError):
        ids = []
    photos = []
    for pid in ids:
        photo = db.query(Photo).filter(Photo.id == pid).first()
        if photo:  # skip photos that have since been removed
            photos.append(photo_to_response(photo))
    return CombinationResponse(id=combo.id, created_at=combo.created_at, photos=photos)


@router.get("/combinations", response_model=list[CombinationResponse])
def list_combinations(db: Session = Depends(get_db)):
    combos = db.query(FavoriteCombination).order_by(FavoriteCombination.id.desc()).all()
    return [_to_response(c, db) for c in combos]


@router.post("/combinations", response_model=CombinationResponse)
def create_combination(data: CombinationCreate, db: Session = Depends(get_db)):
    # Keep only valid, existing photo ids (deduped, order preserved), capped at 4.
    seen: set[int] = set()
    ids: list[int] = []
    for pid in data.photo_ids:
        if pid in seen:
            continue
        if db.query(Photo.id).filter(Photo.id == pid).first():
            seen.add(pid)
            ids.append(pid)
        if len(ids) >= 4:
            break
    if not ids:
        raise HTTPException(status_code=400, detail="No valid photos")

    combo = FavoriteCombination(
        photo_ids=json.dumps(ids),
        created_at=datetime.now().isoformat(),
    )
    db.add(combo)
    db.commit()
    db.refresh(combo)
    return _to_response(combo, db)


@router.delete("/combinations/{combo_id}")
def delete_combination(combo_id: int, db: Session = Depends(get_db)):
    combo = db.query(FavoriteCombination).filter(FavoriteCombination.id == combo_id).first()
    if combo:
        db.delete(combo)
        db.commit()
    return {"deleted": True}
