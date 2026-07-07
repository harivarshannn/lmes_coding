const express = require('express');
const router = express.Router();
const rateLimit = require('../../common/utils/rate_limit');

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
  } else if (username === "instructor" && password === "instructor123") {
    return res.json({
      status: "success",
      token: "mock-instructor-token-99999",
      role: "instructor",
      username: username
    });
  }

  return res.status(401).json({
    error: {
      code: "UNAUTHORIZED",
      message: "Invalid credentials. Hint: Use admin/admin123, student/student123, or instructor/instructor123"
    }
  });
});

module.exports = router;
