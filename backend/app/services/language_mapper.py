from app.utils.exceptions import InvalidLanguageException

LANGUAGE_MAP = {
    "python": 71,
    "java": 62,
    "javascript": 63,
    "typescript": 74,
    "sql": 82,
    "html": 71,   # Evaluated via Python 3 validator script
    "react": 71   # Evaluated via Python 3 validator script
}

def get_language_id(language: str) -> int:
    lang_key = language.strip().lower()
    if lang_key not in LANGUAGE_MAP:
        raise InvalidLanguageException(language)
    return LANGUAGE_MAP[lang_key]
