const { getJudge0Service } = require('./judge0_service');
const { getLanguageId } = require('./language_mapper');

class Evaluator {
  static clean_output(text) {
    if (!text) {
      return "";
    }
    return text.trim().split(/\r?\n/).map(line => line.trim()).filter(line => line).join('\n');
  }

  static async evaluate(code, language, testcases) {
    const judge0 = getJudge0Service();
    const languageId = getLanguageId(language);

    let passed = 0;
    const total = testcases.length;

    if (total === 0) {
      return ["Accepted", 0, 0];
    }

    let finalVerdict = "Accepted";

    for (const tc of testcases) {
      let execCode = code;
      let stdinData = tc.input;

      if (language === "sql") {
        execCode = (tc.input || "") + "\n" + code;
        stdinData = "";
      }

      const result = await judge0.executeCode(execCode, languageId, stdinData);
      const statusId = result.status.id;

      if (statusId === 6) {
        return ["Compilation Error", 0, total];
      } else if (statusId === 5) {
        return ["Time Limit Exceeded", passed, total];
      } else if (statusId === 15) {
        return ["Memory Limit Exceeded", passed, total];
      } else if ([7, 8, 9, 10, 11, 12, 13, 14].includes(statusId)) {
        return ["Runtime Error", passed, total];
      }

      if (statusId === 3) {
        const actual = Evaluator.clean_output(result.stdout);
        const expected = Evaluator.clean_output(tc.expected_output);
        if (actual === expected) {
          passed += 1;
        } else {
          finalVerdict = "Wrong Answer";
        }
      } else {
        return ["Runtime Error", passed, total];
      }
    }

    return [finalVerdict, passed, total];
  }
}

module.exports = Evaluator;
