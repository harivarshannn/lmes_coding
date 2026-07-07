const express = require('express');
const router = express.Router();
const UsersService = require('./users.service');

router.get('/users/:id/profile', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const profile = await UsersService.getProfile(id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
