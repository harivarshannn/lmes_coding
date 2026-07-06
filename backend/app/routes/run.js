const express = require('express');
const router = express.Router();
const rateLimit = require('../utils/rate_limit');
const { getJudge0Service } = require('../services/judge0_service');
const { getLanguageId } = require('../services/language_mapper');

router.post('/run', rateLimit(5, 60), async (req, res, next) => {
  try {
    const { language, code, input } = req.body;

    const languageId = getLanguageId(language);
    const judge0 = getJudge0Service();

    let execCode = code;
    let stdinData = input;

    if (language.trim().toLowerCase() === "sql") {
      execCode = (input || "") + "\n" + code;
      stdinData = "";
    }

    const result = await judge0.executeCode(execCode, languageId, stdinData);

    const statusDesc = result.status.description;

    let combinedErr = "";
    if (result.stderr) {
      combinedErr = result.stderr;
    } else if (result.compile_output) {
      combinedErr = result.compile_output;
    }

    res.json({
      status: statusDesc,
      stdout: result.stdout,
      stderr: combinedErr,
      execution_time: String(result.time),
      memory: parseInt(result.memory, 10)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
