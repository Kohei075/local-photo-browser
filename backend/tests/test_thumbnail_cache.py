import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from starlette.requests import Request

from database import Base
from models.photo import Photo
from routers.images import get_thumbnail, thumbnail_response


def request(**headers):
    return Request({"type": "http", "headers": [
        (key.replace("_", "-").encode(), value.encode()) for key, value in headers.items()
    ]})


class ThumbnailCacheTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = Path(self.temp.name) / "thumbnail.jpg"
        self.path.write_bytes(b"test JPEG data")

    def tearDown(self):
        self.temp.cleanup()

    def test_unchanged_thumbnail_returns_empty_304(self):
        first = thumbnail_response(request(), str(self.path))
        self.assertEqual(first.status_code, 200)
        for tag in (first.headers["etag"], '"other", W/' + first.headers["etag"], "*"):
            response = thumbnail_response(request(if_none_match=tag), str(self.path))
            self.assertEqual(response.status_code, 304)
            self.assertEqual(response.body, b"")
            self.assertEqual(response.headers["cache-control"], "no-cache")

    def test_changed_thumbnail_is_sent_again(self):
        etag = thumbnail_response(request(), str(self.path)).headers["etag"]
        self.path.write_bytes(b"replacement JPEG with different content")
        response = thumbnail_response(request(if_none_match=etag), str(self.path))
        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.headers["etag"], etag)

    def test_etag_takes_precedence_over_modified_since(self):
        first = thumbnail_response(request(), str(self.path))
        response = thumbnail_response(request(
            if_none_match='"outdated"', if_modified_since=first.headers["last-modified"],
        ), str(self.path))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(thumbnail_response(request(
            if_modified_since=first.headers["last-modified"],
        ), str(self.path)).status_code, 304)
        self.assertEqual(thumbnail_response(request(if_modified_since="invalid"), str(self.path)).status_code, 200)

    def test_missing_original_still_returns_404(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        with Session(engine) as db:
            photo = Photo(file_path=str(Path(self.temp.name) / "missing.jpg"),
                          file_name="missing.jpg", extension="jpg", file_size=1,
                          created_at="2026-01-01", modified_at="2026-01-01",
                          scanned_at="2026-01-01", thumbnail_path=str(self.path))
            db.add(photo)
            db.commit()
            with self.assertRaises(HTTPException) as error:
                get_thumbnail(photo.id, request(if_none_match="*"), db)
            self.assertEqual(error.exception.status_code, 404)
        engine.dispose()


if __name__ == "__main__":
    unittest.main()
