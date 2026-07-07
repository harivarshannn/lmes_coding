const express = require('express');
const router = express.Router();
const TopicRepository = require('./topics.repo');

router.get('/topics', async (req, res, next) => {
  try {
    const list = await TopicRepository.getAll();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
