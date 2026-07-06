const express = require('express');
const cors = require('cors');
const path = require('path');
const { CodingPlatformException } = require('./utils/exceptions');
const { startBackgroundWorker } = require('./services/submission_service');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const questionsRouter = require('./routes/questions');
const testcasesRouter = require('./routes/testcases');
const runRouter = require('./routes/run');
const submissionsRouter = require('./routes/submissions');
const learningRouter = require('./routes/learning');
const leaderboardRouter = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Register routers
app.use(healthRouter);
app.use(authRouter);
app.use(questionsRouter);
app.use(testcasesRouter);
app.use(runRouter);
app.use(submissionsRouter);
app.use(learningRouter);
app.use(leaderboardRouter);

// Serve premium frontend static files
app.use('/static', express.static(path.join(__dirname, '../static')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../static/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  if (err instanceof CodingPlatformException) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON body payload"
      }
    });
  }

  console.error("Unhandled server error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected error occurred"
    }
  });
});

// Initialize background queue worker
startBackgroundWorker();

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI-Powered Coding Practice Platform Node.js Backend listening on port ${PORT}`);
  });
}

module.exports = app;
