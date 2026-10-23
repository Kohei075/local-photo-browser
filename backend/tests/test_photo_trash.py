import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

from database import Base
from models.photo import Photo
from routers.photos import _trash_lock, trash_photos
from schemas.photo import TrashPhotosRequest
from services.trash import move_to_trash


class PhotoTrashTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.cache = self.root / "thumbnails"
        self.cache.mkdir()
        self.bin = self.root / "test-trash"
        self.bin.mkdir()
        self.engine = create_engine("sqlite://")

        @event.listens_for(self.engine, "connect")
        def foreign_keys(connection, _):
            connection.execute("PRAGMA foreign_keys=ON")

        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.cache_patch = patch("routers.photos.THUMBNAIL_DIR", str(self.cache))
        self.cache_patch.start()

    def tearDown(self):
        self.cache_patch.stop()
        self.db.close()
        self.engine.dispose()
        self.temp.cleanup()

    def photo(self, name="写真.jpg"):
        path = self.root / name
        path.write_bytes(b"disposable test file")
        photo = Photo(file_path=str(path), file_name=name, extension=path.suffix[1:], file_size=20,
                      created_at="2026-01-01", modified_at="2026-01-01", scanned_at="2026-01-01")
        self.db.add(photo)
        self.db.commit()
        (self.cache / f"{photo.id}.jpg").write_bytes(b"cached thumbnail")
        return photo

    def test_only_selected_file_and_its_cache_are_removed(self):
        selected = self.photo()
        selected_id = selected.id
        unselected = self.photo("keep.jpg")

        def recycle(path):
            shutil.move(path, self.bin / Path(path).name)

        with patch("routers.photos.move_to_trash", side_effect=recycle) as trash:
            result = trash_photos(TrashPhotosRequest(photo_ids=[selected_id, selected_id]), self.db)
        trash.assert_called_once()
        self.assertEqual(result.deleted_ids, [selected_id])
        self.assertEqual(result.failed, [])
        self.assertIsNone(self.db.get(Photo, selected_id))
        self.assertFalse((self.cache / f"{selected_id}.jpg").exists())
        self.assertTrue((self.bin / "写真.jpg").exists())
        self.assertTrue(Path(unselected.file_path).exists())
        self.assertIsNotNone(self.db.get(Photo, unselected.id))
        self.assertTrue((self.cache / f"{unselected.id}.jpg").exists())

    def test_mixed_results_keep_failed_original_record_and_thumbnail(self):
        good = self.photo("good.mp4")
        bad = self.photo("locked.jpg")
        good_id, bad_id = good.id, bad.id

        def recycle(path):
            if path == bad.file_path:
                raise PermissionError("File is in use")
            shutil.move(path, self.bin / Path(path).name)

        with patch("routers.photos.move_to_trash", side_effect=recycle), self.assertLogs("routers.photos", level="WARNING"):
            result = trash_photos(TrashPhotosRequest(photo_ids=[good_id, bad_id, 999]), self.db)
        self.assertEqual(result.deleted_ids, [good_id])
        self.assertEqual([(item.id, item.reason) for item in result.failed],
                         [(bad_id, "trash_failed"), (999, "not_found")])
        self.assertIsNone(self.db.get(Photo, good_id))
        self.assertIsNotNone(self.db.get(Photo, bad_id))
        self.assertTrue(Path(bad.file_path).exists())
        self.assertTrue((self.cache / f"{bad_id}.jpg").exists())

    def test_missing_file_does_not_delete_its_record(self):
        photo = self.photo()
        Path(photo.file_path).unlink()
        with self.assertLogs("routers.photos", level="WARNING"):
            result = trash_photos(TrashPhotosRequest(photo_ids=[photo.id]), self.db)
        self.assertEqual(result.deleted_ids, [])
        self.assertEqual(result.failed[0].reason, "trash_failed")
        self.assertIsNotNone(self.db.get(Photo, photo.id))

    def test_cache_failure_does_not_hide_successful_recycle(self):
        photo = self.photo()
        photo_id = photo.id
        with patch("routers.photos.move_to_trash"), patch("routers.photos.os.remove", side_effect=PermissionError), self.assertLogs("routers.photos", level="WARNING"):
            result = trash_photos(TrashPhotosRequest(photo_ids=[photo_id]), self.db)
        self.assertEqual(result.deleted_ids, [photo_id])
        self.assertIsNone(self.db.get(Photo, photo_id))

    def test_unexpected_os_error_keeps_record_and_releases_lock(self):
        photo = self.photo()
        with patch("routers.photos.move_to_trash", side_effect=RuntimeError("Shell unavailable")), self.assertLogs("routers.photos", level="WARNING"):
            result = trash_photos(TrashPhotosRequest(photo_ids=[photo.id]), self.db)
        self.assertEqual(result.deleted_ids, [])
        self.assertEqual(result.failed[0].id, photo.id)
        self.assertIsNotNone(self.db.get(Photo, photo.id))
        self.assertFalse(_trash_lock.locked())

    def test_concurrent_deletion_is_rejected(self):
        _trash_lock.acquire()
        try:
            with self.assertRaises(HTTPException) as error:
                trash_photos(TrashPhotosRequest(photo_ids=[1]), self.db)
            self.assertEqual(error.exception.status_code, 409)
        finally:
            _trash_lock.release()

    def test_request_rejects_paths_empty_lists_and_invalid_ids(self):
        for ids in ([], ["C:/photos/test.jpg"], [True], [0], [-1], [1.2]):
            with self.subTest(ids=ids), self.assertRaises(ValidationError):
                TrashPhotosRequest(photo_ids=ids)

    def test_request_accepts_more_than_200_photos(self):
        ids = list(range(1, 1001))
        self.assertEqual(TrashPhotosRequest(photo_ids=ids).photo_ids, ids)

    def test_trash_service_rejects_directories_and_missing_files(self):
        for path in (self.root, self.root / "missing.jpg"):
            with self.subTest(path=path), self.assertRaises(FileNotFoundError):
                move_to_trash(str(path))

    def test_trash_service_checks_that_os_actually_moved_file(self):
        photo = self.photo()
        target = "send2trash.win.modern.send2trash" if sys.platform == "win32" else "send2trash.send2trash"
        with patch(target) as trash, self.assertRaises(OSError):
            move_to_trash(photo.file_path)
        trash.assert_called_once_with(photo.file_path)
        self.assertTrue(Path(photo.file_path).exists())


if __name__ == "__main__":
    unittest.main()
