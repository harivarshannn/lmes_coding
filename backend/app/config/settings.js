const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const isDocker = fs.existsSync('/.dockerenv');

class Settings {
  constructor() {
    this.DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/coding_platform";
    this.JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";
    this.REDIS_URL = process.env.REDIS_URL || "redis://:redispassword@localhost:6379/0";
    this.AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8080";
  }

  get resolved_judge0_url() {
    let url = this.JUDGE0_URL;
    if (isDocker && url.includes('localhost')) {
      return url.replace('localhost', 'host.docker.internal');
    }
    return url;
  }

  get resolved_database_url() {
    let url = this.DATABASE_URL;
    if (isDocker && url.includes('localhost')) {
      return url.replace('localhost', 'mongodb');
    }
    return url;
  }

  get resolved_redis_url() {
    let url = this.REDIS_URL;
    if (isDocker && url.includes('localhost')) {
      return url.replace('localhost', 'redis');
    }
    return url;
  }

  get resolved_ai_service_url() {
    let url = this.AI_SERVICE_URL;
    if (isDocker && url.includes('localhost')) {
      return url.replace('localhost', 'ai-service');
    }
    return url;
  }
}

module.exports = new Settings();
