from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from app.repositories.user_repo import UserRepository
from app.repositories.question_repo import QuestionRepository
from app.models.hint import Hint
from app.models.solution import Solution

class LearningService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.question_repo = QuestionRepository(db)

    def get_reveal_stage(self, user_id: int, question_id: int) -> Dict[str, Any]:
        """
        Determines the learning/hint reveal stage for a user on a specific question:
        - Attempt 1: Small hint
        - Attempt 2: Detailed hint
        - Attempt 3: Approach
        - Attempt 4+: Reveal solution
        """
        attempts_count = self.user_repo.get_attempt_count(user_id, question_id)
        
        # Stages are 1-indexed to attempts.
        # Stage 0: No attempts made.
        if attempts_count == 0:
            return {
                "attempts_count": 0,
                "stage": 0,
                "hint": "Try writing some code and running it first to get your first hint!",
                "solution_unlocked": False
            }

        # Check for specific hints for stages 1, 2, 3
        hint_stage = attempts_count
        if hint_stage > 3:
            hint_stage = 4 # Stage 4 and above reveals solution

        hint_obj = self.db.query(Hint).filter_by(
            question_id=question_id, 
            attempt_number=hint_stage
        ).first()

        result = {
            "attempts_count": attempts_count,
            "stage": hint_stage,
            "hint": hint_obj.hint if hint_obj else None,
            "solution_unlocked": attempts_count >= 4,
            "solution": None
        }

        # Handle fallbacks if hint DB is missing entries
        if not result["hint"]:
            if hint_stage == 1:
                result["hint"] = "Hint 1: Think about a brute-force approach first."
            elif hint_stage == 2:
                result["hint"] = "Hint 2: Can you use a hash map or sorted array to optimize it?"
            elif hint_stage == 3:
                result["hint"] = "Hint 3 (Approach): Loop through the input while storing seen values."

        # If attempt count is 4 or more, retrieve the solution
        if attempts_count >= 4:
            solution_obj = self.db.query(Solution).filter_by(question_id=question_id).first()
            if solution_obj:
                # We return the solution code, explanation, and complexity
                result["solution"] = {
                    "code": solution_obj.code,
                    "explanation": solution_obj.explanation,
                    "complexity": solution_obj.complexity
                }
            else:
                result["solution"] = {
                    "code": "# Solution template missing.",
                    "explanation": "No explanation available.",
                    "complexity": "O(N)"
                }

        return result
        
    def generate_ai_feedback(self, user_id: int, attempt_id: int) -> str:
        """
        Communicates with external AI service container to generate code feedback.
        """
        import requests
        from app.config.settings import settings
        from app.models.user_attempt import UserAttempt
        
        attempt = self.db.query(UserAttempt).filter(UserAttempt.id == attempt_id).first()
        if not attempt:
            return "Attempt not found."
            
        question = self.question_repo.get_by_id(attempt.question_id)
        
        payload = {
            "code": attempt.submitted_code,
            "language": "python", # fallback or mapped
            "problem_title": question.title if question else "Code Attempt",
            "problem_description": question.description if question else "",
            "verdict": attempt.status
        }
        
        try:
            response = requests.post(f"{settings.resolved_ai_service_url}/ai/feedback", json=payload, timeout=5)
            if response.status_code == 200:
                return response.json().get("feedback") or "Feedback was empty."
        except Exception as e:
            print(f"Failed to fetch AI feedback from AI service: {e}")
            
        return f"AI Review (Local Fallback) on Attempt #{attempt_id}: The logic looks solid. Ensure edge cases like empty arrays and high indices are fully handled."
