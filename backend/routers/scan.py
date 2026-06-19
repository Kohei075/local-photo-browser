import json
import os

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import SUPPORTED_EXTENSIONS, THUMBNAIL_DIR
from database import get_db, SessionLocal
from models.setting import Setting
from models.photo import Photo
from services.scanner import scan_folder, scan_status

router = APIRouter()

DEFAULT_EXTENSIONS = ",".join(sorted(SUPPORTED_EXTENSIONS))


def run_scan():
    db = SessionLocal()
    try:
        settings = {s.key: s.value for s in db.query(Setting).all()}
        root_folder = settings.get("root_folder", "")
        extensions_str = settings.get("extensions", DEFAULT_EXTENSIONS)
        extensions = {e.strip().lower() for e in extensions_str.split(",") if e.strip()}
        excluded_str = settings.get("excluded_folders", "[]")
        excluded_folders = set(json.loads(excluded_str))

        if root_folder:
            scan_folder(root_folder, extensions, db, excluded_folders)
    finally:
        db.close()


@router.post("/scan")
def start_scan(background_tasks: BackgroundTasks):
    if scan_status["is_scanning"]:
        return {"message": "Scan already in progress"}
    scan_status["is_scanning"] = True
    background_tasks.add_task(run_scan)
    return {"message": "Scan started"}


class PartialScanRequest(BaseModel):
    folders: list[str]


def run_partial_scan(folders: list[str]):
    db = SessionLocal()
    try:
        settings = {s.key: s.value for s in db.query(Setting).all()}
        root_folder = settings.get("root_folder", "")
        extensions_str = settings.get("extensions", DEFAULT_EXTENSIONS)
        extensions = {e.strip().lower() for e in extensions_str.split(",") if e.strip()}
        excluded_str = settings.get("excluded_folders", "[]")
        excluded_folders = set(json.loads(excluded_str))

        if root_folder:
            scan_folder(root_folder, extensions, db, excluded_folders, target_folders=folders)
    finally:
        db.close()


@router.post("/scan/partial")
def start_partial_scan(req: PartialScanRequest, background_tasks: BackgroundTasks):
    if scan_status["is_scanning"]:
        return {"message": "Scan already in progress"}
    if not req.folders:
        return {"message": "No folders specified"}
    scan_status["is_scanning"] = True
    background_tasks.add_task(run_partial_scan, req.folders)
    return {"message": "Partial scan started"}


class DeleteFoldersRequest(BaseModel):
    folders: list[str]


delete_status = {
    "is_deleting": False,
    "total": 0,
    "processed": 0,
    "error": None,
}


def _norm(p: str) -> str:
    return os.path.normcase(os.path.normpath(p))


def _within(norm_path: str, prefixes: list[str]) -> bool:
    for pre in prefixes:
        if norm_path == pre or norm_path.startswith(pre + os.sep):
            return True
    return False


def run_delete(folders: list[str]):
    """Delete scanned photo records (and cached thumbnails) within the given folders.

    Matching is done on normalized path prefixes (not SQL LIKE) so underscores in
    folder names aren't treated as wildcards. Only DB data and the thumbnail cache
    are removed — the actual media files on disk are never touched.
    """
    db = SessionLocal()
    try:
        target_prefixes = [_norm(f) for f in folders]
        ids = [
            pid for pid, fpath in db.query(Photo.id, Photo.file_path).all()
            if _within(os.path.normcase(fpath), target_prefixes)
        ]
        delete_status["total"] = len(ids)
        delete_status["processed"] = 0

        for i in range(0, len(ids), 200):
            chunk = ids[i:i + 200]
            for pid in chunk:
                thumb = os.path.join(THUMBNAIL_DIR, f"{pid}.jpg")
                try:
                    if os.path.isfile(thumb):
                        os.remove(thumb)
                except OSError:
                    pass
            db.query(Photo).filter(Photo.id.in_(chunk)).delete(synchronize_session=False)
            db.commit()
            delete_status["processed"] = min(i + 200, len(ids))
    except Exception as e:
        delete_status["error"] = str(e)
        try:
            db.rollback()
        except Exception:
            pass
    finally:
        delete_status["is_deleting"] = False
        db.close()


@router.post("/scan/delete-folders")
def start_delete(req: DeleteFoldersRequest, background_tasks: BackgroundTasks):
    if delete_status["is_deleting"] or scan_status["is_scanning"]:
        return {"message": "Busy"}
    if not req.folders:
        return {"message": "No folders specified"}
    delete_status["is_deleting"] = True
    delete_status["total"] = 0
    delete_status["processed"] = 0
    delete_status["error"] = None
    background_tasks.add_task(run_delete, req.folders)
    return {"message": "Delete started"}


@router.get("/scan/delete-status")
def get_delete_status():
    return delete_status


@router.get("/scan/status")
def get_scan_status():
    return scan_status
