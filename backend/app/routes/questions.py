from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.database.redis import RedisCache
from app.repositories.question_repo import QuestionRepository
from app.models.question import Question
from app.models.question_language import QuestionLanguage
from app.models.language import Language
from app.models.hint import Hint
from app.models.solution import Solution
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionResponse
from app.utils.exceptions import QuestionNotFoundException
import time

router = APIRouter()

def invalidate_questions_cache():
    RedisCache.delete("questions:all")
    RedisCache.clear_pattern("question:id:*")
    RedisCache.clear_pattern("question:slug:*")

@router.post("/questions", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(question_in: QuestionCreate, db: Session = Depends(get_db)):
    repo = QuestionRepository(db)
    
    # Check if slug exists
    if repo.get_by_slug(question_in.slug):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Question with slug '{question_in.slug}' already exists."
        )

    db_question = Question(
        title=question_in.title,
        slug=question_in.slug,
        description=question_in.description,
        difficulty=question_in.difficulty,
        estimated_time=question_in.estimated_time,
        marks=question_in.marks,
        topic_id=question_in.topic_id,
        question_type=question_in.question_type,
        memory_limit=question_in.memory_limit,
        time_limit=question_in.time_limit,
        status=question_in.status
    )
    repo.create(db_question)

    # Save starter code templates
    if question_in.starter_codes:
        for lang_name, code in question_in.starter_codes.items():
            lang = db.query(Language).filter(Language.name.ilike(lang_name)).first()
            if lang:
                repo.add_language_template(db_question.id, lang.id, code)

    # Save tags
    if question_in.tags:
        for tag_name in question_in.tags:
            repo.add_tag(db_question.id, tag_name)

    invalidate_questions_cache()
    return db_question

@router.get("/questions", response_model=List[QuestionResponse])
def read_questions(db: Session = Depends(get_db)):
    # Try loading from cache
    cached = RedisCache.get("questions:all")
    if cached is not None:
        return cached

    repo = QuestionRepository(db)
    questions = repo.get_all()
    
    # Serialize to standard Pydantic models for caching
    serialized = []
    for q in questions:
        serialized.append({
            "id": q.id,
            "title": q.title,
            "slug": q.slug,
            "description": q.description,
            "statement": q.description, # legacy compatibility
            "difficulty": q.difficulty,
            "estimated_time": q.estimated_time,
            "marks": q.marks,
            "topic_id": q.topic_id,
            "question_type": q.question_type,
            "memory_limit": q.memory_limit,
            "time_limit": q.time_limit,
            "status": q.status,
            "created_at": q.created_at.isoformat(),
            "template_python": q.template_python,
            "template_javascript": q.template_javascript,
            "template_html": q.template_html,
            "template_sql": q.template_sql
        })
        
    RedisCache.set("questions:all", serialized, expire_seconds=600)
    return questions

@router.get("/questions/{id}", response_model=QuestionResponse)
def read_question(id: int, db: Session = Depends(get_db)):
    cache_key = f"question:id:{id}"
    cached = RedisCache.get(cache_key)
    if cached is not None:
        return cached

    repo = QuestionRepository(db)
    db_question = repo.get_by_id(id)
    if not db_question:
        raise QuestionNotFoundException(id)
        
    serialized = {
        "id": db_question.id,
        "title": db_question.title,
        "slug": db_question.slug,
        "description": db_question.description,
        "statement": db_question.description, # legacy compatibility
        "difficulty": db_question.difficulty,
        "estimated_time": db_question.estimated_time,
        "marks": db_question.marks,
        "topic_id": db_question.topic_id,
        "question_type": db_question.question_type,
        "memory_limit": db_question.memory_limit,
        "time_limit": db_question.time_limit,
        "status": db_question.status,
        "created_at": db_question.created_at.isoformat(),
        "template_python": db_question.template_python,
        "template_javascript": db_question.template_javascript,
        "template_html": db_question.template_html,
        "template_sql": db_question.template_sql
    }
    RedisCache.set(cache_key, serialized, expire_seconds=600)
    return db_question

@router.put("/questions/{id}", response_model=QuestionResponse)
def update_question(id: int, question_in: QuestionUpdate, db: Session = Depends(get_db)):
    repo = QuestionRepository(db)
    db_question = repo.get_by_id(id)
    if not db_question:
        raise QuestionNotFoundException(id)

    # Update simple fields
    for field, value in question_in.model_dump(exclude_unset=True).items():
        if field not in ["starter_codes", "tags"]:
            setattr(db_question, field, value)

    # Update starter templates
    if question_in.starter_codes:
        for lang_name, code in question_in.starter_codes.items():
            lang = db.query(Language).filter(Language.name.ilike(lang_name)).first()
            if lang:
                repo.add_language_template(db_question.id, lang.id, code)

    # Update tags
    if question_in.tags:
        # Clear existing tags first (simple delete logic)
        db.query(QuestionTag).filter_by(question_id=db_question.id).delete()
        for tag_name in question_in.tags:
            repo.add_tag(db_question.id, tag_name)

    repo.update()
    invalidate_questions_cache()
    
    # Refresh to return full updated data
    db.refresh(db_question)
    return db_question

@router.delete("/questions/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(id: int, db: Session = Depends(get_db)):
    repo = QuestionRepository(db)
    db_question = repo.get_by_id(id)
    if not db_question:
        raise QuestionNotFoundException(id)
    repo.delete(db_question)
    invalidate_questions_cache()
    return None

@router.post("/questions/{id}/duplicate", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def duplicate_question(id: int, db: Session = Depends(get_db)):
    repo = QuestionRepository(db)
    db_question = repo.get_by_id(id)
    if not db_question:
        raise QuestionNotFoundException(id)

    # Create a duplicate with slightly modified title and slug
    dup_title = f"{db_question.title} (Duplicate)"
    dup_slug = f"{db_question.slug}-duplicate-{int(time.time())}"

    dup_question = Question(
        title=dup_title,
        slug=dup_slug,
        description=db_question.description,
        difficulty=db_question.difficulty,
        estimated_time=db_question.estimated_time,
        marks=db_question.marks,
        topic_id=db_question.topic_id,
        question_type=db_question.question_type,
        memory_limit=db_question.memory_limit,
        time_limit=db_question.time_limit,
        status="unpublished" # Duplicates default to unpublished
    )
    repo.create(dup_question)

    # Copy starter templates
    for ql in db_question.question_languages:
        repo.add_language_template(dup_question.id, ql.language_id, ql.starter_code)

    # Copy tags
    for qt in db_question.question_tags:
        tag = db.query(Tag).filter(Tag.id == qt.tag_id).first()
        if tag:
            repo.add_tag(dup_question.id, tag.name)

    invalidate_questions_cache()
    return dup_question

@router.post("/questions/bulk-import", status_code=status.HTTP_201_CREATED)
def bulk_import_questions(questions_in: List[QuestionCreate], db: Session = Depends(get_db)):
    repo = QuestionRepository(db)
    imported_count = 0
    
    for question_in in questions_in:
        # Avoid duplicate slugs
        if repo.get_by_slug(question_in.slug):
            continue
            
        db_question = Question(
            title=question_in.title,
            slug=question_in.slug,
            description=question_in.description,
            difficulty=question_in.difficulty,
            estimated_time=question_in.estimated_time,
            marks=question_in.marks,
            topic_id=question_in.topic_id,
            question_type=question_in.question_type,
            memory_limit=question_in.memory_limit,
            time_limit=question_in.time_limit,
            status=question_in.status
        )
        repo.create(db_question)

        # Starters
        if question_in.starter_codes:
            for lang_name, code in question_in.starter_codes.items():
                lang = db.query(Language).filter(Language.name.ilike(lang_name)).first()
                if lang:
                    repo.add_language_template(db_question.id, lang.id, code)

        # Tags
        if question_in.tags:
            for tag_name in question_in.tags:
                repo.add_tag(db_question.id, tag_name)
                
        imported_count += 1

    invalidate_questions_cache()
    return {"status": "success", "imported": imported_count}

@router.post("/questions/{id}/hints", status_code=status.HTTP_201_CREATED)
def add_question_hint(id: int, attempt_number: int, hint_text: str, db: Session = Depends(get_db)):
    # Check if question exists
    question = db.query(Question).filter(Question.id == id).first()
    if not question:
        raise QuestionNotFoundException(id)
        
    db_hint = Hint(question_id=id, attempt_number=attempt_number, hint=hint_text)
    db.add(db_hint)
    db.commit()
    return {"status": "success", "hint_id": db_hint.id}

@router.post("/questions/{id}/solutions", status_code=status.HTTP_201_CREATED)
def add_question_solution(id: int, language_name: str, code: str, explanation: str, complexity: str = "O(N)", db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == id).first()
    if not question:
        raise QuestionNotFoundException(id)
        
    lang = db.query(Language).filter(Language.name.ilike(language_name)).first()
    if not lang:
        raise HTTPException(status_code=400, detail=f"Language '{language_name}' not supported.")
        
    db_sol = Solution(
        question_id=id,
        language_id=lang.id,
        code=code,
        explanation=explanation,
        complexity=complexity
    )
    db.add(db_sol)
    db.commit()
    return {"status": "success", "solution_id": db_sol.id}
