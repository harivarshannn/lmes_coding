const express = require('express');
const rateLimit = require('../utils/rate_limit');
const router = express.Router();

router.post('/login', rateLimit(5, 60), (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    return res.json({
      status: "success",
      token: "mock-admin-token-12345",
      role: "admin",
      username: username
    });
  } else if (username === "student" && password === "student123") {
    return res.json({
      status: "success",
      token: "mock-student-token-54321",
      role: "student",
      username: username
    });
  }

  return res.status(401).json({
    error: {
      code: "UNAUTHORIZED",
      message: "Invalid credentials. Hint: Use admin/admin123 or student/student123"
    }
  });
});

module.exports = router;
