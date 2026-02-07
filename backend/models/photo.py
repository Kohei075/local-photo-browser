from sqlalchemy import Column, Integer, Text, Index

from database import Base


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_path = Column(Text, nullable=False, unique=True)
    file_name = Column(Text, nullable=False)
    extension = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_at = Column(Text, nullable=False)
    modified_at = Column(Text, nullable=False)
    taken_at = Column(Text, nullable=True)
    is_favorite = Column(Integer, nullable=False, default=0)
    thumbnail_path = Column(Text, nullable=True)
    scanned_at = Column(Text, nullable=False)

    __table_args__ = (
        Index("ix_photos_file_path", "file_path"),
        Index("ix_photos_is_favorite", "is_favorite"),
        Index("ix_photos_created_at", "created_at"),
        Index("ix_photos_modified_at", "modified_at"),
        Index("ix_photos_taken_at", "taken_at"),
        Index("ix_photos_file_name", "file_name"),
    )
