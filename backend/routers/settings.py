import json
import os
import shutil
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db, Base, engine, SessionLocal, init_db
from models.setting import Setting
from models.photo import Photo
from schemas.setting import SettingsResponse, SettingsUpdate, ExcludedFoldersResponse, ExcludedFoldersUpdate
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
    if data.root_folder is not None and data.root_folder.strip():
        if not os.path.isdir(data.root_folder.strip()):
            raise HTTPException(status_code=400, detail="Folder not found")

    now = datetime.now().isoformat()

    # Clear excluded folders when root_folder changes
    if data.root_folder is not None:
        old_root = get_settings_dict(db).get("root_folder", "")
        if old_root != data.root_folder.strip():
            ef = db.query(Setting).filter(Setting.key == "excluded_folders").first()
            if ef:
                ef.value = "[]"
                ef.updated_at = now

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
def reset_db(db: Session = Depends(get_db)):
    """Delete all photo records and thumbnail cache, preserving settings."""
    if os.path.isdir(THUMBNAIL_DIR):
        shutil.rmtree(THUMBNAIL_DIR)
        os.makedirs(THUMBNAIL_DIR, exist_ok=True)

    db.query(Photo).delete()
    db.commit()
    return {"message": "Database reset complete"}


@router.post("/settings/pick-folder")
def pick_folder():
    """Open native OS folder picker dialog and return selected path."""
    import threading

    result: dict = {"path": ""}

    def _open_dialog():
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        root.attributes("-topmost", True)
        folder = filedialog.askdirectory(title="Select Folder")
        root.destroy()
        if folder:
            result["path"] = os.path.normpath(folder)

    # tkinter must run on a dedicated thread (not asyncio event loop)
    t = threading.Thread(target=_open_dialog)
    t.start()
    t.join(timeout=120)

    return result


@router.get("/settings/excluded-folders", response_model=ExcludedFoldersResponse)
def get_excluded_folders(db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.key == "excluded_folders").first()
    excluded = json.loads(setting.value) if setting else []
    return ExcludedFoldersResponse(excluded_folders=excluded)


@router.put("/settings/excluded-folders", response_model=ExcludedFoldersResponse)
def update_excluded_folders(data: ExcludedFoldersUpdate, db: Session = Depends(get_db)):
    now = datetime.now().isoformat()
    excluded = data.excluded_folders

    setting = db.query(Setting).filter(Setting.key == "excluded_folders").first()
    if setting:
        setting.value = json.dumps(excluded)
        setting.updated_at = now
    else:
        db.add(Setting(key="excluded_folders", value=json.dumps(excluded), updated_at=now))

    # Delete photos from excluded folders
    for folder in excluded:
        norm_folder = os.path.normpath(folder)
        prefix = norm_folder + os.sep
        db.query(Photo).filter(Photo.file_path.like(prefix + "%")).delete(synchronize_session=False)
    db.commit()

    return ExcludedFoldersResponse(excluded_folders=excluded)
