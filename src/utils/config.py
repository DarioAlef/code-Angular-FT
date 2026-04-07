# src/utils/config.py
from pathlib import Path
from pydantic import BaseModel
from pydantic_settings import BaseSettings

# Root absoluto do projeto (não depende de CWD)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class GroqConfig(BaseModel):
    api_key: str = ""
    model: str = "openai/gpt-oss-120b"
    max_tokens: int = 2048
    temperature: float = 0.7
    timeout: int = 45
    delay_seconds: float = 0.5


class LoraConfig(BaseModel):
    rank: int = 16
    alpha: int = 16
    dropout: float = 0.0


class TrainingConfig(BaseModel):
    num_epochs: int = 3
    max_steps: int = -1
    batch_size: int = 1
    learning_rate: float = 5e-5
    gradient_accumulation_steps: int = 8
    early_stopping_patience: int = 3
    max_seq_length: int = 1024
    train_split: float = 0.9
    seed: int = 42


class PathsConfig(BaseModel):
    """Todos os paths absolutos, computados a partir de PROJECT_ROOT"""
    root: Path = PROJECT_ROOT
    data: Path = PROJECT_ROOT / "data"
    datasets: Path = PROJECT_ROOT / "data" / "datasets"
    dataset_file: Path = PROJECT_ROOT / "data" / "datasets" / "augmented" / "augmented_dataset.jsonl"
    adapter_dir: Path = PROJECT_ROOT / "data" / "adapter_qlora_v2"
    output_dir: Path = PROJECT_ROOT / "data" / "output_qlora_v2"
    merged_model_dir: Path = PROJECT_ROOT / "data" / "merged_model"
    comparison_report: Path = PROJECT_ROOT / "data" / "comparison_report.json"
    components_dir: Path = PROJECT_ROOT / "data" / "datasets" / "pre-selected"

    def ensure_dirs(self):
        for p in [self.data, self.datasets, self.adapter_dir, self.output_dir]:
            p.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    # Groq (from .env)
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"

    # Compostos
    groq: GroqConfig = GroqConfig()
    lora: LoraConfig = LoraConfig()
    training: TrainingConfig = TrainingConfig()
    paths: PathsConfig = PathsConfig()

    # Modelo
    model_id: str = "unsloth/Qwen2.5-Coder-3B-Instruct-bnb-4bit"

    # System prompt (usado no treino E na inferência)
    system_prompt: str = (
        "Você é o FPFtech Angular Coder. Gere APENAS código TypeScript Angular "
        "seguindo o padrão BaseComponent da FPFtech. Todo componente DEVE: "
        "estender BaseComponent<T>, usar Injector no construtor, chamar super(injector, options), "
        "implementar createFormGroup() com UntypedFormBuilder, e usar os serviços "
        "herdados (toast, translate, service, router). Responda SOMENTE com código."
    )

    # Inferência
    inference_temperature: float = 0.1
    inference_max_tokens: int = 2048

    # Ambiente
    cuda_visible_devices: str = "0"

    class Config:
        env_file = ".env"
        case_sensitive = False

    def model_post_init(self, __context):
        # Sincroniza groq_api_key do .env com sub-modelo
        if self.groq_api_key:
            self.groq.api_key = self.groq_api_key


settings = Settings()
