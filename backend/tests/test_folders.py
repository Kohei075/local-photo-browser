import os
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from database import Base
from models.photo import Photo
from models.setting import Setting
from routers.folders import get_folders


class FolderTreeTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.root = os.path.abspath("test_photos")

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def add_photo(self, relative_path):
        path = os.path.join(self.root, relative_path)
        self.db.add(Photo(
            file_path=path, file_name=os.path.basename(path), extension="jpg",
            file_size=1, created_at="2026-01-01", modified_at="2026-01-01",
            scanned_at="2026-01-01", is_favorite=0,
        ))

    def test_no_root_returns_empty_tree(self):
        self.assertEqual(get_folders(self.db), {"root": "", "folders": []})

    def test_shared_ancestors_natural_order_and_root_photos(self):
        self.db.add(Setting(key="root_folder", value=self.root, updated_at="2026-01-01"))
        for path in (
            "root.jpg", os.path.join("album10", "a.jpg"),
            os.path.join("album2", "nested", "a.jpg"),
            os.path.join("album2", "nested", "b.jpg"),
            os.path.join("album2", "b.jpg"),
        ):
            self.add_photo(path)
        self.db.commit()

        data = get_folders(self.db)
        self.assertEqual(data["root"], self.root)
        self.assertEqual([n["name"] for n in data["folders"]], ["album2", "album10"])
        album = data["folders"][0]
        self.assertEqual(album["path"], os.path.join(self.root, "album2"))
        self.assertEqual(album["children"], [{
            "name": "nested", "path": os.path.join(self.root, "album2", "nested"),
            "children": [],
        }])


if __name__ == "__main__":
    unittest.main()
