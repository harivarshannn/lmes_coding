const axios = require('axios');
const settings = require('../config/settings');
const { Judge0UnavailableException } = require('../utils/exceptions');

class Judge0Service {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async submitCode(sourceCode, languageId, stdin = "") {
    const url = `${this.baseUrl}/submissions?base64_encoded=false`;
    const payload = {
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin
    };
    try {
      const response = await axios.post(url, payload, { timeout: 10000 });
      return response.data.token;
    } catch (e) {
      throw new Judge0UnavailableException(`Failed to submit code to Judge0: ${e.message}`);
    }
  }

  async getSubmissionResult(token) {
    const url = `${this.baseUrl}/submissions/${token}?base64_encoded=false`;
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;
      return {
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        compile_output: data.compile_output || "",
        status: data.status || { id: 13, description: "Internal Error" },
        time: data.time || "0.0",
        memory: data.memory || 0
      };
    } catch (e) {
      throw new Judge0UnavailableException(`Failed to get submission result from Judge0: ${e.message}`);
    }
  }

  async executeCode(sourceCode, languageId, stdin = "") {
    const token = await this.submitCode(sourceCode, languageId, stdin);
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.getSubmissionResult(token);
      const statusId = result.status.id;
      if (statusId !== 1 && statusId !== 2) {
        return result;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return {
      stdout: "",
      stderr: "Execution timed out",
      compile_output: "",
      status: { id: 5, description: "Time Limit Exceeded" },
      time: "0.0",
      memory: 0
    };
  }
}

class MockJudge0Service {
  async submitCode(sourceCode, languageId, stdin = "") {
    return "mock-token-12345";
  }

  async getSubmissionResult(token) {
    return {
      stdout: token.includes("hello") ? "hello\n" : "mock output\n",
      stderr: "",
      compile_output: "",
      status: { id: 3, description: "Accepted" },
      time: "0.01",
      memory: 10240
    };
  }

  async executeCode(sourceCode, languageId, stdin = "") {
    let stdout = "mock output\n";
    if (sourceCode.includes("print('hello')") || sourceCode.includes('print("hello")') || sourceCode.includes('console.log("hello")') || sourceCode.includes("console.log('hello')")) {
      stdout = "hello\n";
    } else if (sourceCode.includes("print('Hello World')") || sourceCode.includes('print("Hello World")')) {
      stdout = "Hello World\n";
    }
    return {
      stdout: stdout,
      stderr: "",
      compile_output: "",
      status: { id: 3, description: "Accepted" },
      time: "0.01",
      memory: 10240
    };
  }
}

function getJudge0Service() {
  const envUrl = process.env.JUDGE0_URL;
  if (envUrl === undefined || envUrl === "") {
    return new MockJudge0Service();
  }
  return new Judge0Service(settings.resolved_judge0_url);
}

module.exports = {
  getJudge0Service,
  Judge0Service,
  MockJudge0Service
};
