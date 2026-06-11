from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.question import Question
from app.schemas.question import QuestionCreate, QuestionResponse
from app.utils.exceptions import QuestionNotFoundException

router = APIRouter()

@router.post("/questions", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_question(question_in: QuestionCreate, db: Session = Depends(get_db)):
    db_question = Question(
        title=question_in.title,
        difficulty=question_in.difficulty,
        statement=question_in.statement,
        template_python=question_in.template_python,
        template_cpp=question_in.template_cpp,
        template_java=question_in.template_java,
        template_javascript=question_in.template_javascript,
        template_typescript=question_in.template_typescript,
        template_sql=question_in.template_sql,
        template_html=question_in.template_html,
        template_react=question_in.template_react
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return {"id": db_question.id}

@router.get("/questions", response_model=List[QuestionResponse])
def read_questions(db: Session = Depends(get_db)):
    return db.query(Question).all()

@router.get("/questions/{id}", response_model=QuestionResponse)
def read_question(id: int, db: Session = Depends(get_db)):
    db_question = db.query(Question).filter(Question.id == id).first()
    if not db_question:
        raise QuestionNotFoundException(id)
    return db_question

@router.delete("/questions/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(id: int, db: Session = Depends(get_db)):
    db_question = db.query(Question).filter(Question.id == id).first()
    if not db_question:
        raise QuestionNotFoundException(id)
    db.delete(db_question)
    db.commit()
    return None
