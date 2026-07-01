from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.topic import Topic

class TopicRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, topic_id: int) -> Optional[Topic]:
        return self.db.query(Topic).filter(Topic.id == topic_id).first()

    def get_all(self) -> List[Topic]:
        return self.db.query(Topic).order_by(Topic.name).all()

    def create(self, topic: Topic) -> Topic:
        self.db.add(topic)
        self.db.commit()
        self.db.refresh(topic)
        return topic

    def delete(self, topic: Topic) -> None:
        self.db.delete(topic)
        self.db.commit()
        
    def save(self) -> None:
        self.db.commit()
