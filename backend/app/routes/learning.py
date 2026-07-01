from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.learning_service import LearningService

router = APIRouter()

@router.get("/questions/{id}/stage", status_code=status.HTTP_200_OK)
def get_hint_stage(id: int, student_id: int = Query(..., description="The ID of the student"), db: Session = Depends(get_db)):
    service = LearningService(db)
    return service.get_reveal_stage(user_id=student_id, question_id=id)

@router.post("/attempts/{attempt_id}/feedback", status_code=status.HTTP_200_OK)
def get_ai_feedback(attempt_id: int, student_id: int = Query(..., description="The ID of the student"), db: Session = Depends(get_db)):
    service = LearningService(db)
    feedback_text = service.generate_ai_feedback(user_id=student_id, attempt_id=attempt_id)
    return {"status": "success", "attempt_id": attempt_id, "feedback": feedback_text}
