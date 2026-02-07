from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import DB_URL


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


def init_db():
    import models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        from models.setting import Setting
        defaults = {
            "root_folder": "",
            "extensions": "jpg,jpeg,png,webp",
            "thumbnail_size": "300",
        }
        for key, value in defaults.items():
            existing = db.query(Setting).filter(Setting.key == key).first()
            if not existing:
                from datetime import datetime
                db.add(Setting(key=key, value=value, updated_at=datetime.now().isoformat()))
        db.commit()
    finally:
        db.close()
