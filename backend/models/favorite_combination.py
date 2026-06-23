from sqlalchemy import Column, Integer, Text

from database import Base


class FavoriteCombination(Base):
    __tablename__ = "favorite_combinations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    photo_ids = Column(Text, nullable=False)  # JSON array of photo IDs (ordered)
    created_at = Column(Text, nullable=False)
