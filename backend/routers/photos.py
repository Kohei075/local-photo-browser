import math
import os
import logging
from threading import Lock
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from config import VIDEO_EXTENSIONS, THUMBNAIL_DIR
from database import get_db
from models.photo import Photo
from schemas.photo import (
    PhotoResponse, PhotoListResponse, NeighborsResponse,
    TrashPhotosRequest, TrashPhotosResponse, TrashPhotoFailure,
)
from services.trash import move_to_trash

router = APIRouter()
logger = logging.getLogger(__name__)
_trash_lock = Lock()

# Date columns that the date-range filter can be applied to.
DATE_FIELD_MAP = {
    "created_at": Photo.created_at,
    "modified_at": Photo.modified_at,
    "taken_at": Photo.taken_at,
}


def _parse_day(day: str) -> Optional[date]:
    """Parse a 'YYYY-MM-DD' string; return None when it is not a valid date."""
    try:
        return date.fromisoformat(day)
    except ValueError:
        return None


def photo_to_response(photo: Photo) -> PhotoResponse:
    # Use scanned_at as cache buster to avoid stale browser cache after DB reset
    v = photo.scanned_at or ""
    return PhotoResponse(
        id=photo.id,
        file_path=photo.file_path,
        file_name=photo.file_name,
        extension=photo.extension,
        file_size=photo.file_size,
        width=photo.width,
        height=photo.height,
        duration=photo.duration,
        created_at=photo.created_at,
        modified_at=photo.modified_at,
        taken_at=photo.taken_at,
        is_favorite=bool(photo.is_favorite),
        thumbnail_url=f"/api/images/{photo.id}/thumbnail?v={v}",
    )


def build_query(
    db: Session,
    favorite_only: bool = False,
    folder_path: Optional[str] = None,
    include_subfolders: bool = True,
    media_type: str = "all",
    date_field: str = "modified_at",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    query = db.query(Photo)
    if favorite_only:
        query = query.filter(Photo.is_favorite == 1)
    if media_type == "photos":
        query = query.filter(Photo.extension.notin_(VIDEO_EXTENSIONS))
    elif media_type == "videos":
        query = query.filter(Photo.extension.in_(VIDEO_EXTENSIONS))
    if folder_path is not None:
        prefix = os.path.normpath(folder_path)
        if not prefix.endswith(os.sep):
            prefix += os.sep
        query = query.filter(Photo.file_path.like(prefix + "%"))
        if not include_subfolders:
            # Exclude paths that have an extra path separator after the prefix
            query = query.filter(~Photo.file_path.like(prefix + "%" + os.sep + "%"))
    date_col = DATE_FIELD_MAP.get(date_field)
    if date_col is not None:
        # Dates are stored as ISO strings, so lexicographic comparison works.
        if date_from and _parse_day(date_from):
            query = query.filter(date_col >= date_from)
        if date_to:
            end = _parse_day(date_to)
            if end:
                # Exclusive upper bound = the day after, so date_to is inclusive
                query = query.filter(date_col < (end + timedelta(days=1)).isoformat())
    return query


@router.get("/photos", response_model=PhotoListResponse)
def get_photos(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    favorite_only: bool = Query(False),
    folder_path: Optional[str] = Query(None),
    include_subfolders: bool = Query(True),
    media_type: str = Query("all"),
    date_field: str = Query("modified_at"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = build_query(
        db, favorite_only, folder_path, include_subfolders, media_type,
        date_field, date_from, date_to,
    )
    total = query.count()

    sort_column_map = {
        "created_at": Photo.created_at,
        "modified_at": Photo.modified_at,
        "taken_at": Photo.taken_at,
        "file_name": Photo.file_name,
    }

    sort_col = sort_column_map.get(sort_by, Photo.created_at)

    if sort_by == "random":
        query = query.order_by(func.random())
    elif sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    offset = (page - 1) * per_page
    photos = query.offset(offset).limit(per_page).all()

    return PhotoListResponse(
        items=[photo_to_response(p) for p in photos],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total > 0 else 0,
    )


@router.get("/photos/random", response_model=PhotoResponse)
def get_random_photo(
    favorite_only: bool = Query(False),
    folder_path: Optional[str] = Query(None),
    include_subfolders: bool = Query(True),
    media_type: str = Query("all"),
    date_field: str = Query("modified_at"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = build_query(
        db, favorite_only, folder_path, include_subfolders, media_type,
        date_field, date_from, date_to,
    )
    photo = query.order_by(func.random()).first()
    if not photo:
        raise HTTPException(status_code=404, detail="No photos found")
    return photo_to_response(photo)


@router.post("/photos/trash", response_model=TrashPhotosResponse)
def trash_photos(req: TrashPhotosRequest, db: Session = Depends(get_db)):
    if not _trash_lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="Photo deletion already in progress")
    deleted_ids = []
    failed = []
    try:
        for photo_id in dict.fromkeys(req.photo_ids):
            photo = db.get(Photo, photo_id)
            if photo is None:
                failed.append(TrashPhotoFailure(id=photo_id, file_name="", reason="not_found"))
                continue
            try:
                move_to_trash(photo.file_path)
            except Exception:
                logger.warning("Could not trash photo %s (%s)", photo_id, photo.file_path, exc_info=True)
                failed.append(TrashPhotoFailure(id=photo_id, file_name=photo.file_name, reason="trash_failed"))
                continue

            # Persist each success: another file failing must not restore a DB
            # record whose original has already been moved to the recycle bin.
            db.delete(photo)
            db.commit()
            deleted_ids.append(photo_id)
            # Only remove our generated cache, never an arbitrary stored path.
            try:
                os.remove(os.path.join(THUMBNAIL_DIR, f"{photo_id}.jpg"))
            except FileNotFoundError:
                pass
            except OSError:
                logger.warning("Could not remove thumbnail for photo %s", photo_id, exc_info=True)
        return TrashPhotosResponse(deleted_ids=deleted_ids, failed=failed)
    finally:
        _trash_lock.release()


@router.get("/photos/{photo_id}", response_model=PhotoResponse)
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    return photo_to_response(photo)


@router.get("/photos/{photo_id}/neighbors", response_model=NeighborsResponse)
def get_neighbors(
    photo_id: int,
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    favorite_only: bool = Query(False),
    folder_path: Optional[str] = Query(None),
    include_subfolders: bool = Query(True),
    media_type: str = Query("all"),
    date_field: str = Query("modified_at"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    sort_column_map = {
        "created_at": Photo.created_at,
        "modified_at": Photo.modified_at,
        "taken_at": Photo.taken_at,
        "file_name": Photo.file_name,
    }
    sort_col = sort_column_map.get(sort_by, Photo.created_at)

    current = db.query(Photo).filter(Photo.id == photo_id).first()
    if not current:
        raise HTTPException(status_code=404, detail="Photo not found")

    base_query = build_query(
        db, favorite_only, folder_path, include_subfolders, media_type,
        date_field, date_from, date_to,
    )
    current_val = getattr(current, sort_by if sort_by in sort_column_map else "created_at")

    if sort_order == "desc":
        prev_photo = (
            base_query.filter(
                (sort_col > current_val) | ((sort_col == current_val) & (Photo.id > photo_id))
            )
            .order_by(sort_col.asc(), Photo.id.asc())
            .first()
        )
        next_photo = (
            base_query.filter(
                (sort_col < current_val) | ((sort_col == current_val) & (Photo.id < photo_id))
            )
            .order_by(sort_col.desc(), Photo.id.desc())
            .first()
        )
    else:
        prev_photo = (
            base_query.filter(
                (sort_col < current_val) | ((sort_col == current_val) & (Photo.id < photo_id))
            )
            .order_by(sort_col.desc(), Photo.id.desc())
            .first()
        )
        next_photo = (
            base_query.filter(
                (sort_col > current_val) | ((sort_col == current_val) & (Photo.id > photo_id))
            )
            .order_by(sort_col.asc(), Photo.id.asc())
            .first()
        )

    return NeighborsResponse(
        prev_id=prev_photo.id if prev_photo else None,
        next_id=next_photo.id if next_photo else None,
    )
