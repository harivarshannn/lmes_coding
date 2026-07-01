from app.utils.exceptions import InvalidLanguageException

LANGUAGE_MAP = {
    "python": 71,
    "javascript": 63,
    "sql": 82
}

def get_language_id(language: str) -> int:
    lang_key = language.strip().lower()
    if lang_key not in LANGUAGE_MAP:
        raise InvalidLanguageException(language)
    return LANGUAGE_MAP[lang_key]
