from sqlalchemy import Column, Integer, Text
from sqlalchemy.orm import relationship

from database import Base


class PersonTag(Base):
    __tablename__ = "person_tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)
    created_at = Column(Text, nullable=False)

    photos = relationship(
        "Photo",
        secondary="photo_persons",
        back_populates="person_tags",
        lazy="selectin",
    )
