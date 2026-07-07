const UsersRepository = require('./users.repo');

class UsersService {
  static getProfile(userId) {
    return UsersRepository.getOrCreateProfile(userId);
  }
}

module.exports = UsersService;
