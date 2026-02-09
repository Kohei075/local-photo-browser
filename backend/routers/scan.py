import json

from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, SessionLocal
from models.setting import Setting
from services.scanner import scan_folder, scan_status

router = APIRouter()


def run_scan():
    db = SessionLocal()
    try:
        settings = {s.key: s.value for s in db.query(Setting).all()}
        root_folder = settings.get("root_folder", "")
        extensions_str = settings.get("extensions", "jpg,jpeg,png,webp")
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
    background_tasks.add_task(run_scan)
    return {"message": "Scan started"}


class PartialScanRequest(BaseModel):
    folders: list[str]


def run_partial_scan(folders: list[str]):
    db = SessionLocal()
    try:
        settings = {s.key: s.value for s in db.query(Setting).all()}
        root_folder = settings.get("root_folder", "")
        extensions_str = settings.get("extensions", "jpg,jpeg,png,webp")
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
    background_tasks.add_task(run_partial_scan, req.folders)
    return {"message": "Partial scan started"}


@router.get("/scan/status")
def get_scan_status():
    return scan_status
