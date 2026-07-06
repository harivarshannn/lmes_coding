const { InvalidLanguageException } = require('../utils/exceptions');

const LANGUAGE_MAP = {
  "python": 71,
  "javascript": 63,
  "sql": 82
};

function getLanguageId(language) {
  if (!language) {
    throw new InvalidLanguageException(language);
  }
  const langKey = language.trim().toLowerCase();
  if (!(langKey in LANGUAGE_MAP)) {
    throw new InvalidLanguageException(language);
  }
  return LANGUAGE_MAP[langKey];
}

module.exports = {
  LANGUAGE_MAP,
  getLanguageId
};
