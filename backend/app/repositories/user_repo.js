const db = require('../database/session');

class UserRepository {
  // Streak Operations
  static async getOrCreateStreak(userId) {
    const col = await db.collection('daily_streaks');
    const streak = await col.findOne({ user_id: userId });
    if (streak) {
      return streak;
    }
    const id = await db.getNextSequenceValue('streak_id');
    const doc = {
      _id: id,
      id: id,
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null
    };
    await col.insertOne(doc);
    return doc;
  }

  static async updateStreak(userId) {
    const col = await db.collection('daily_streaks');
    const streak = await this.getOrCreateStreak(userId);
    const todayStr = new Date().toISOString().split('T')[0];

    if (streak.last_activity_date) {
      const lastActStr = new Date(streak.last_activity_date).toISOString().split('T')[0];
      if (lastActStr === todayStr) {
        return streak;
      }

      const lastDate = new Date(lastActStr);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate - lastDate);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let currentStreak = streak.current_streak;
      if (diffDays === 1) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }

      let longestStreak = streak.longest_streak;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      await col.updateOne(
        { user_id: userId },
        { $set: { current_streak: currentStreak, longest_streak: longestStreak, last_activity_date: todayStr } }
      );
      return await col.findOne({ user_id: userId });
    } else {
      await col.updateOne(
        { user_id: userId },
        { $set: { current_streak: 1, longest_streak: 1, last_activity_date: todayStr } }
      );
      return await col.findOne({ user_id: userId });
    }
  }

  // Leaderboard / XP Operations
  static async getOrCreateProfile(userId, username = "Anonymous Student") {
    const col = await db.collection('leaderboard');
    const profile = await col.findOne({ user_id: userId });
    if (profile) {
      return profile;
    }
    const id = await db.getNextSequenceValue('leaderboard_id');
    const doc = {
      _id: id,
      id: id,
      user_id: userId,
      username: username,
      xp: 0,
      rank: 0
    };
    await col.insertOne(doc);
    return doc;
  }

  static async addXp(userId, xpAmount) {
    const col = await db.collection('leaderboard');
    const profile = await this.getOrCreateProfile(userId);
    const newXp = profile.xp + xpAmount;
    await col.updateOne({ user_id: userId }, { $set: { xp: newXp } });
    await this.recalculateRanks();
    return await this.getOrCreateProfile(userId);
  }

  static async recalculateRanks() {
    const col = await db.collection('leaderboard');
    const all = await col.find({}).sort({ xp: -1 }).toArray();
    for (let i = 0; i < all.length; i++) {
      const rank = i + 1;
      await col.updateOne({ _id: all[i]._id }, { $set: { rank: rank } });
    }
  }

  static async getLeaderboard(limit = 50) {
    const col = await db.collection('leaderboard');
    const list = await col.find({}).sort({ rank: 1 }).limit(limit).toArray();
    return list.map(row => {
      return {
        user_id: row.user_id,
        username: row.username,
        xp: row.xp,
        rank: row.rank
      };
    });
  }

  // User Attempts
  static async recordAttempt(userId, questionId, languageId, status, runtime, memory, submittedCode) {
    const col = await db.collection('user_attempts');
    const attemptNumber = (await col.countDocuments({ user_id: userId, question_id: questionId })) + 1;
    const id = await db.getNextSequenceValue('attempt_id');
    const doc = {
      _id: id,
      id: id,
      user_id: userId,
      question_id: questionId,
      language_id: languageId,
      status: status,
      runtime: runtime ?? null,
      memory: memory ?? null,
      attempt_number: attemptNumber,
      submitted_code: submittedCode,
      created_at: new Date()
    };
    await col.insertOne(doc);
    return doc;
  }

  static async getAttempts(userId, questionId) {
    const col = await db.collection('user_attempts');
    return await col.find({ user_id: userId, question_id: questionId }).sort({ attempt_number: 1 }).toArray();
  }

  static async getAttemptCount(userId, questionId) {
    const col = await db.collection('user_attempts');
    return await col.countDocuments({ user_id: userId, question_id: questionId });
  }

  // Progress Tracking
  static async markProgress(userId, questionId, status) {
    const col = await db.collection('progress');
    const progress = await col.findOne({ user_id: userId, question_id: questionId });
    if (!progress) {
      const id = await db.getNextSequenceValue('progress_id');
      const doc = {
        _id: id,
        id: id,
        user_id: userId,
        question_id: questionId,
        status: status,
        updated_at: new Date()
      };
      await col.insertOne(doc);
      return doc;
    } else {
      const currentStatus = progress.status;
      if (currentStatus !== "solved" || status === "solved") {
        await col.updateOne(
          { user_id: userId, question_id: questionId },
          { $set: { status: status, updated_at: new Date() } }
        );
        return await col.findOne({ user_id: userId, question_id: questionId });
      }
      return progress;
    }
  }

  // Bookmarks
  static async toggleBookmark(userId, questionId) {
    const col = await db.collection('bookmarks');
    const existing = await col.findOne({ user_id: userId, question_id: questionId });
    if (existing) {
      await col.deleteOne({ user_id: userId, question_id: questionId });
      return false;
    } else {
      const id = await db.getNextSequenceValue('bookmark_id');
      await col.insertOne({ _id: id, id, user_id: userId, question_id: questionId });
      return true;
    }
  }

  // Favorites
  static async toggleFavorite(userId, questionId) {
    const col = await db.collection('favorites');
    const existing = await col.findOne({ user_id: userId, question_id: questionId });
    if (existing) {
      await col.deleteOne({ user_id: userId, question_id: questionId });
      return false;
    } else {
      const id = await db.getNextSequenceValue('favorite_id');
      await col.insertOne({ _id: id, id, user_id: userId, question_id: questionId });
      return true;
    }
  }

  // Achievements / Badges
  static async awardBadgeIfEarned(userId, badgeName) {
    const badgeCol = await db.collection('badges');
    const badge = await badgeCol.findOne({ name: badgeName });
    if (!badge) {
      return null;
    }
    const badgeId = badge._id;

    const achCol = await db.collection('achievements');
    const ach = await achCol.findOne({ user_id: userId, badge_id: badgeId });
    if (!ach) {
      const id = await db.getNextSequenceValue('achievement_id');
      const doc = {
        _id: id,
        id: id,
        user_id: userId,
        badge_id: badgeId,
        earned_at: new Date()
      };
      await achCol.insertOne(doc);
      return doc;
    }
    return null;
  }

  static async getUserAchievements(userId) {
    const achCol = await db.collection('achievements');
    const achievements = await achCol.find({ user_id: userId }).toArray();
    if (achievements.length === 0) {
      return [];
    }
    const badgeIds = achievements.map(a => a.badge_id);
    const badgeCol = await db.collection('badges');
    return await badgeCol.find({ _id: { $in: badgeIds } }).toArray();
  }
}

module.exports = UserRepository;
