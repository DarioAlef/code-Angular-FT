from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    project_name: str = "code-Angular-FT"


    @field_validator(
        "GEMINI_API_KEY",
        mode="before",
    )
    @classmethod
    def remove_quotes(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip(' "\'\n\r\t')
        return v

    # Gemini
    GEMINI_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

settings = Settings()
