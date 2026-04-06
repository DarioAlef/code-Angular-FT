# src/config.py
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Carrega configurações do .env automaticamente"""

    # Groq API (OBRIGATÓRIOS do .env)
    groq_api_key: str
    groq_model: str = "openai/gpt-oss-20b"

    # Groq Parameters (OTIMIZADOS)
    groq_max_tokens: int = 1024          # 5 instruções
    groq_temperature: float = 0.5        # Consistência
    groq_timeout: int = 45               # 45 segundos
    groq_delay_seconds: float = 0.3      # 300ms

    # Unsloth
    model_id: str = "unsloth/Qwen2.5-Coder-3B-bnb-4bit"
    max_seq_length: int = 2048

    # Training
    num_epochs: int = 3
    batch_size: int = 4
    learning_rate: float = 2e-4

    # Paths
    dataset_file: Path = Path("dados_2026.jsonl")
    adapter_dir: Path = Path("adapter_qlora_v2")
    skeleton_web_dir: Path = Path("skeleton-web/src/app/components")

    # Inference
    inference_temperature: float = 0.1
    inference_max_tokens: int = 512

    class Config:
        env_file = ".env"
        case_sensitive = False


# Carrega automaticamente do .env
settings = Settings()
