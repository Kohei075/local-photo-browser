import os
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models.photo import Photo
from models.setting import Setting

router = APIRouter()


def _build_tree(folders: list[str], root_folder: str) -> list[dict]:
    """Build a nested folder tree from a flat list of folder paths."""
    tree: dict = {}
    for folder in sorted(folders):
        # Make path relative to root_folder
        rel = os.path.relpath(folder, root_folder)
        if rel == ".":
            continue
        parts = rel.replace("\\", "/").split("/")
        node = tree
        for part in parts:
            if part not in node:
                node[part] = {}
            node = node[part]

    def to_list(node: dict, current_path: str) -> list[dict]:
        result = []
        for name in sorted(node.keys()):
            child_path = f"{current_path}/{name}" if current_path else name
            children = to_list(node[name], child_path)
            result.append({
                "name": name,
                "path": os.path.join(root_folder, child_path.replace("/", os.sep)),
                "children": children,
            })
        return result

    return to_list(tree, "")


@router.get("/folders")
def get_folders(db: Session = Depends(get_db)):
    """Get folder hierarchy from scanned photos."""
    root_setting = db.query(Setting).filter(Setting.key == "root_folder").first()
    root_folder = root_setting.value if root_setting else ""

    if not root_folder:
        return {"root": root_folder, "folders": []}

    # Get distinct folder paths from photo file_paths
    rows = db.query(Photo.file_path).all()
    folder_set: set[str] = set()
    for (file_path,) in rows:
        folder = os.path.dirname(file_path)
        # Add this folder and all parent folders up to root
        while folder and len(folder) >= len(root_folder):
            folder_set.add(folder)
            parent = os.path.dirname(folder)
            if parent == folder:
                break
            folder = parent

    tree = _build_tree(list(folder_set), root_folder)
    return {"root": root_folder, "folders": tree}


@router.get("/folders/browse")
def browse_folders(path: str = Query(""), max_depth: int = Query(10, ge=1, le=20)):
    """Browse filesystem folders under a given root path."""
    if not path or not os.path.isdir(path):
        return {"folders": []}

    def build_tree(root: str, depth: int = 0) -> list[dict]:
        if depth >= max_depth:
            return []
        result = []
        try:
            entries = sorted(os.scandir(root), key=lambda e: e.name.lower())
        except PermissionError:
            return result
        for entry in entries:
            if entry.is_dir(follow_symlinks=False) and not entry.name.startswith("."):
                children = build_tree(entry.path, depth + 1)
                result.append({
                    "name": entry.name,
                    "path": os.path.normpath(entry.path),
                    "children": children,
                })
        return result

    folders = build_tree(path)
    return {"folders": folders}


@router.get("/folders/search")
def search_folders(
    q: str = Query("", min_length=0),
    db: Session = Depends(get_db),
):
    """Search files and folders by name."""
    if not q.strip():
        return {"results": []}

    search_term = f"%{q.strip()}%"

    # Search photos by file_name or folder path
    photos = (
        db.query(Photo.id, Photo.file_path, Photo.file_name)
        .filter(
            (Photo.file_name.ilike(search_term))
            | (Photo.file_path.ilike(search_term))
        )
        .limit(50)
        .all()
    )

    results = []
    seen_folders: set[str] = set()

    for photo_id, file_path, file_name in photos:
        folder = os.path.dirname(file_path)
        # Add folder match
        if q.lower() in os.path.basename(folder).lower() and folder not in seen_folders:
            seen_folders.add(folder)
            results.append({
                "type": "folder",
                "name": os.path.basename(folder),
                "path": folder,
            })
        # Add file match
        if q.lower() in file_name.lower():
            results.append({
                "type": "file",
                "name": file_name,
                "path": file_path,
                "photo_id": photo_id,
            })

    return {"results": results[:50]}
