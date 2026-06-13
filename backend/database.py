from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import DB_URL, SUPPORTED_EXTENSIONS


engine = create_engine(DB_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _migrate_schema():
    """Lightweight migrations for additive columns (no Alembic in this project)."""
    from sqlalchemy import text
    with engine.begin() as conn:
        cols = {row[1] for row in conn.execute(text("PRAGMA table_info(photos)"))}
        if "duration" not in cols:
            conn.execute(text("ALTER TABLE photos ADD COLUMN duration REAL"))


def init_db():
    import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _migrate_schema()

    db = SessionLocal()
    try:
        from datetime import datetime
        from models.setting import Setting

        supported_ext = ",".join(sorted(SUPPORTED_EXTENSIONS))
        defaults = {
            "root_folder": "",
            "extensions": supported_ext,
            "thumbnail_size": "300",
        }
        for key, value in defaults.items():
            existing = db.query(Setting).filter(Setting.key == key).first()
            if not existing:
                db.add(Setting(key=key, value=value, updated_at=datetime.now().isoformat()))
            elif key == "extensions" and existing.value != supported_ext:
                # The extensions list is code-defined (no longer user-editable),
                # so keep the stored value in sync with the supported set.
                existing.value = supported_ext
                existing.updated_at = datetime.now().isoformat()
        db.commit()
    finally:
        db.close()
