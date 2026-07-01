from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import List, Optional
from app.models.daily_streak import DailyStreak
from app.models.leaderboard import Leaderboard
from app.models.user_attempt import UserAttempt
from app.models.progress import Progress
from app.models.bookmark import Bookmark
from app.models.favorite import Favorite
from app.models.badge import Badge
from app.models.achievement import Achievement

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    # Streak Operations
    def get_or_create_streak(self, user_id: int) -> DailyStreak:
        streak = self.db.query(DailyStreak).filter(DailyStreak.user_id == user_id).first()
        if not streak:
            streak = DailyStreak(user_id=user_id, current_streak=0, longest_streak=0)
            self.db.add(streak)
            self.db.commit()
            self.db.refresh(streak)
        return streak

    def update_streak(self, user_id: int) -> DailyStreak:
        streak = self.get_or_create_streak(user_id)
        today = date.today()
        if streak.last_activity_date == today:
            return streak # Already updated today
            
        if streak.last_activity_date:
            delta = (today - streak.last_activity_date).days
            if delta == 1:
                streak.current_streak += 1
            elif delta > 1:
                streak.current_streak = 1 # Streak broken, reset to 1
        else:
            streak.current_streak = 1
            
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak
            
        streak.last_activity_date = today
        self.db.commit()
        self.db.refresh(streak)
        return streak

    # Leaderboard / XP Operations
    def get_or_create_profile(self, user_id: int, username: str = "Anonymous Student") -> Leaderboard:
        profile = self.db.query(Leaderboard).filter(Leaderboard.user_id == user_id).first()
        if not profile:
            profile = Leaderboard(user_id=user_id, username=username, xp=0, rank=0)
            self.db.add(profile)
            self.db.commit()
            self.db.refresh(profile)
        return profile

    def add_xp(self, user_id: int, xp_amount: int) -> Leaderboard:
        profile = self.get_or_create_profile(user_id)
        profile.xp += xp_amount
        self.db.commit()
        self.db.refresh(profile)
        self.recalculate_ranks()
        return profile

    def recalculate_ranks(self) -> None:
        # Simple dense rank update
        profiles = self.db.query(Leaderboard).order_by(Leaderboard.xp.desc()).all()
        for rank_idx, profile in enumerate(profiles, start=1):
            profile.rank = rank_idx
        self.db.commit()

    def get_leaderboard(self, limit: int = 50) -> List[Leaderboard]:
        return self.db.query(Leaderboard).order_by(Leaderboard.rank.asc()).limit(limit).all()

    # User Attempts
    def record_attempt(self, user_id: int, question_id: int, language_id: int, status: str, runtime: float, memory: int, submitted_code: str) -> UserAttempt:
        # Calculate attempt number
        attempt_count = self.db.query(UserAttempt).filter_by(user_id=user_id, question_id=question_id).count()
        attempt_number = attempt_count + 1
        
        attempt = UserAttempt(
            user_id=user_id,
            question_id=question_id,
            language_id=language_id,
            status=status,
            runtime=runtime,
            memory=memory,
            attempt_number=attempt_number,
            submitted_code=submitted_code
        )
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def get_attempts(self, user_id: int, question_id: int) -> List[UserAttempt]:
        return self.db.query(UserAttempt).filter_by(user_id=user_id, question_id=question_id).order_by(UserAttempt.attempt_number.asc()).all()

    def get_attempt_count(self, user_id: int, question_id: int) -> int:
        return self.db.query(UserAttempt).filter_by(user_id=user_id, question_id=question_id).count()

    # Progress Tracking
    def mark_progress(self, user_id: int, question_id: int, status: str) -> Progress:
        prog = self.db.query(Progress).filter_by(user_id=user_id, question_id=question_id).first()
        if not prog:
            prog = Progress(user_id=user_id, question_id=question_id, status=status)
            self.db.add(prog)
        else:
            # Once solved, cannot go back to attempted
            if prog.status != "solved" or status == "solved":
                prog.status = status
        self.db.commit()
        self.db.refresh(prog)
        return prog

    # Bookmarks
    def toggle_bookmark(self, user_id: int, question_id: int) -> bool:
        bookmark = self.db.query(Bookmark).filter_by(user_id=user_id, question_id=question_id).first()
        if bookmark:
            self.db.delete(bookmark)
            self.db.commit()
            return False # Removed
        else:
            bookmark = Bookmark(user_id=user_id, question_id=question_id)
            self.db.add(bookmark)
            self.db.commit()
            return True # Added

    # Favorites
    def toggle_favorite(self, user_id: int, question_id: int) -> bool:
        favorite = self.db.query(Favorite).filter_by(user_id=user_id, question_id=question_id).first()
        if favorite:
            self.db.delete(favorite)
            self.db.commit()
            return False # Removed
        else:
            favorite = Favorite(user_id=user_id, question_id=question_id)
            self.db.add(favorite)
            self.db.commit()
            return True # Added

    # Achievements / Badges
    def award_badge_if_earned(self, user_id: int, badge_name: str) -> Optional[Achievement]:
        badge = self.db.query(Badge).filter(Badge.name == badge_name).first()
        if not badge:
            return None
            
        ach = self.db.query(Achievement).filter_by(user_id=user_id, badge_id=badge.id).first()
        if not ach:
            ach = Achievement(user_id=user_id, badge_id=badge.id)
            self.db.add(ach)
            self.db.commit()
            self.db.refresh(ach)
            return ach
        return None
        
    def get_user_achievements(self, user_id: int) -> List[Badge]:
        return self.db.query(Badge).join(Achievement).filter(Achievement.user_id == user_id).all()
