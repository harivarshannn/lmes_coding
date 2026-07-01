import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/coding_platform"
    JUDGE0_URL: str = "http://localhost:2358"
    REDIS_URL: str = "redis://:redispassword@localhost:6379/0"
    AI_SERVICE_URL: str = "http://localhost:8080"
    
    # We can detect if we are running in docker and adjust localhost if needed
    @property
    def resolved_judge0_url(self) -> str:
        url = self.JUDGE0_URL
        # If running inside docker, localhost references to host.docker.internal or judge0-server
        if os.path.exists("/.dockerenv") and "localhost" in url:
            return url.replace("localhost", "host.docker.internal")
        return url

    @property
    def resolved_database_url(self) -> str:
        url = self.DATABASE_URL
        if os.path.exists("/.dockerenv") and "localhost" in url:
            # When running in docker-compose, postgres host is 'db'
            return url.replace("localhost", "db")
        return url

    @property
    def resolved_redis_url(self) -> str:
        url = self.REDIS_URL
        if os.path.exists("/.dockerenv") and "localhost" in url:
            return url.replace("localhost", "redis")
        return url

    @property
    def resolved_ai_service_url(self) -> str:
        url = self.AI_SERVICE_URL
        if os.path.exists("/.dockerenv") and "localhost" in url:
            return url.replace("localhost", "ai-service")
        return url

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
