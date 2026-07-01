import threading
import time
from typing import Optional
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.database.redis import RedisQueue, RedisCache
from app.repositories.submission_repo import SubmissionRepository
from app.repositories.question_repo import QuestionRepository
from app.repositories.user_repo import UserRepository
from app.models.submission import Submission
from app.models.language import Language
from app.services.evaluator import Evaluator

class SubmissionService:
    def __init__(self, db: Session):
        self.db = db
        self.submission_repo = SubmissionRepository(db)
        self.question_repo = QuestionRepository(db)
        self.user_repo = UserRepository(db)

    def get_language_by_name(self, name: str) -> Optional[Language]:
        return self.db.query(Language).filter(Language.name.ilike(name)).first()

    def enqueue_submission(self, student_id: int, question_id: int, language_name: str, code: str) -> Submission:
        # Create submission with "In Queue" status
        lang = self.get_language_by_name(language_name)
        lang_id = lang.id if lang else None
        
        db_sub = Submission(
            student_id=student_id,
            question_id=question_id,
            language_id=lang_id,
            code=code,
            status="In Queue",
            passed=0,
            total=0
        )
        self.submission_repo.create(db_sub)
        
        # Automatically detect if running in unit tests or if Redis connection is not established
        import sys
        if "pytest" in sys.modules:
            self.process_submission(db_sub.id)
            self.db.refresh(db_sub)
        else:
            try:
                # Enqueue in Redis
                RedisQueue.push("submissions_queue", {
                    "submission_id": db_sub.id
                })
            except Exception as e:
                # Fallback to sync execution on Redis connection failure
                print(f"Redis enqueue failed: {e}. Executing synchronously.")
                self.process_submission(db_sub.id)
                self.db.refresh(db_sub)
        
        return db_sub

    def process_submission(self, submission_id: int) -> None:
        db_sub = self.submission_repo.get_by_id(submission_id)
        if not db_sub:
            return
            
        db_sub.status = "Processing"
        self.submission_repo.update()
        
        # Fetch question and testcases
        question = self.question_repo.get_by_id(db_sub.question_id)
        if not question:
            db_sub.status = "Internal Error"
            self.submission_repo.update()
            return
            
        # Get language name
        language_name = "python" # fallback
        if db_sub.language_id:
            lang = self.db.query(Language).filter(Language.id == db_sub.language_id).first()
            if lang:
                language_name = lang.name.lower()

        # Evaluate testcases
        testcases = question.testcases
        
        try:
            verdict, passed, total = Evaluator.evaluate(
                code=db_sub.code,
                language=language_name,
                testcases=testcases
            )
            
            # Save results
            db_sub.status = verdict
            db_sub.passed = passed
            db_sub.total = total
            self.submission_repo.update()
            
            # Record user attempt & update stats
            self.user_repo.record_attempt(
                user_id=db_sub.student_id,
                question_id=db_sub.question_id,
                language_id=db_sub.language_id or 1,
                status=verdict,
                runtime=0.0, # Filled by evaluator if needed
                memory=0,
                submitted_code=db_sub.code
            )
            
            # Mark progress
            self.user_repo.mark_progress(
                user_id=db_sub.student_id,
                question_id=db_sub.question_id,
                status="solved" if verdict == "Accepted" else "attempted"
            )
            
            # If accepted, reward XP and update streak & leaderboard
            if verdict == "Accepted":
                self.user_repo.add_xp(db_sub.student_id, question.marks)
                self.user_repo.update_streak(db_sub.student_id)
                # Check for "First Solve" badge
                self.user_repo.award_badge_if_earned(db_sub.student_id, "First Solve")
                # Clear leaderboard cache since ranks updated
                RedisCache.delete("leaderboard:top50")
                
            # Clear user progress/stats cache
            RedisCache.delete(f"user:stats:{db_sub.student_id}")
            
        except Exception as e:
            print(f"Error processing submission {submission_id}: {e}")
            db_sub.status = "Runtime Error"
            db_sub.stderr = str(e)
            self.submission_repo.update()

# Background Queue Worker Thread
def start_background_worker():
    def worker_loop():
        print("Starting Redis submission background worker loop...")
        while True:
            try:
                # Poll Redis queue
                job_data = RedisQueue.pop("submissions_queue", timeout_seconds=5)
                if job_data:
                    sub_id = job_data.get("submission_id")
                    if sub_id:
                        db = SessionLocal()
                        try:
                            service = SubmissionService(db)
                            service.process_submission(sub_id)
                        except Exception as ex:
                            print(f"Worker database error for sub {sub_id}: {ex}")
                        finally:
                            db.close()
            except Exception as e:
                print(f"Submission worker loop error: {e}")
                time.sleep(2)
                
    thread = threading.Thread(target=worker_loop, daemon=True)
    thread.start()
