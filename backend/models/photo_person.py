from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint

from database import Base


class PhotoPerson(Base):
    __tablename__ = "photo_persons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    photo_id = Column(Integer, ForeignKey("photos.id", ondelete="CASCADE"), nullable=False)
    person_tag_id = Column(Integer, ForeignKey("person_tags.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("photo_id", "person_tag_id", name="uq_photo_person"),
    )
