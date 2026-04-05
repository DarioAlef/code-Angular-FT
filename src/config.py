# src/config.py
from pathlib import Path
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações centralizadas do projeto"""

    # Groq API
    groq_api_key: str = Field(default="", description="Chave API do Groq")
    groq_model: str = Field(
        default="llama-3.3-70b-versatile",
        description="Modelo Groq para gerar variações"
    )

    # Unsloth + Modelo
    model_id: str = Field(
        default="unsloth/Qwen2.5-Coder-3B-bnb-4bit",
        description="Modelo Qwen quantizado para Unsloth"
    )
    max_seq_length: int = Field(default=2048, description="Comprimento máximo de sequência")

    # Training
    output_dir: Path = Field(default=Path("./checkpoints"), description="Diretório de checkpoints")
    adapter_dir: Path = Field(default=Path("./adapter_qlora_v2"), description="Diretório do adaptador LoRA")
    num_epochs: int = Field(default=3, description="Número de épocas de treinamento")
    batch_size: int = Field(default=4, description="Batch size")
    learning_rate: float = Field(default=2e-4, description="Learning rate")
    lora_rank: int = Field(default=16, description="LoRA rank")
    lora_alpha: int = Field(default=32, description="LoRA alpha")
    lora_dropout: float = Field(default=0.05, description="LoRA dropout")

    # Dataset
    dataset_file: Path = Field(default=Path("./dados_2026.jsonl"), description="Arquivo JSONL do dataset")
    train_split: float = Field(default=0.9, description="Proporção train/test")
    skeleton_web_dir: Path = Field(
        default=Path("./skeleton-web/src/app/components"),
        description="Diretório com componentes Angular"
    )

    # Groq Generation
    groq_max_tokens: int = Field(default=800, description="Max tokens para Groq")
    groq_temperature: float = Field(default=0.7, description="Temperatura do Groq")
    groq_timeout: int = Field(default=30, description="Timeout Groq em segundos")
    groq_delay_seconds: float = Field(default=0.5, description="Delay entre requisições Groq")

    # Inference
    test_prompts_file: Optional[Path] = Field(
        default=None, description="Arquivo com prompts de teste"
    )
    comparison_report_file: Path = Field(
        default=Path("./comparison_report.json"),
        description="Arquivo de saída com comparação"
    )
    inference_max_tokens: int = Field(default=512, description="Max tokens para inferência")

    # Logging
    log_level: str = Field(default="INFO", description="Nível de logging")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Instância global
settings = Settings()
