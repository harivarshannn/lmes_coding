const express = require('express');
const router = express.Router();
const UserRepository = require('../repositories/user_repo');
const { RedisCache } = require('../database/redis');

router.get('/leaderboard', async (req, res, next) => {
  try {
    const cacheKey = "leaderboard:top50";
    const cached = await RedisCache.get(cacheKey);
    if (cached !== null) {
      return res.json(cached);
    }

    const leaders = await UserRepository.getLeaderboard(50);
    await RedisCache.set(cacheKey, leaders, 60);
    res.json(leaders);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
