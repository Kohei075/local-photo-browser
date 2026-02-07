import os
import shutil
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db, Base, engine, SessionLocal, init_db
from models.setting import Setting
from schemas.setting import SettingsResponse, SettingsUpdate
from config import THUMBNAIL_DIR

router = APIRouter()


def get_settings_dict(db: Session) -> dict:
    settings = db.query(Setting).all()
    return {s.key: s.value for s in settings}


@router.get("/settings", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    d = get_settings_dict(db)
    return SettingsResponse(**d)


@router.put("/settings", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    now = datetime.now().isoformat()
    update_data = data.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setting = db.query(Setting).filter(Setting.key == key).first()
        if setting:
            setting.value = value
            setting.updated_at = now
        else:
            db.add(Setting(key=key, value=value, updated_at=now))
    db.commit()
    d = get_settings_dict(db)
    return SettingsResponse(**d)


@router.post("/settings/clear-cache")
def clear_cache():
    if os.path.isdir(THUMBNAIL_DIR):
        shutil.rmtree(THUMBNAIL_DIR)
        os.makedirs(THUMBNAIL_DIR, exist_ok=True)
    return {"message": "Thumbnail cache cleared"}


@router.post("/settings/reset-db")
def reset_db():
    if os.path.isdir(THUMBNAIL_DIR):
        shutil.rmtree(THUMBNAIL_DIR)
        os.makedirs(THUMBNAIL_DIR, exist_ok=True)

    Base.metadata.drop_all(bind=engine)
    init_db()
    return {"message": "Database reset complete"}
