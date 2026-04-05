# src/models/unsloth_wrapper.py
import logging
from typing import Tuple

from unsloth import FastLanguageModel

logger = logging.getLogger(__name__)


class UnslothModel:
    """Wrapper para FastLanguageModel do Unsloth"""

    def __init__(
        self,
        model_id: str,
        max_seq_length: int = 2048,
        dtype: str = "float16",
        load_in_4bit: bool = True,
    ):
        """
        Inicializa o wrapper.

        Args:
            model_id: ID do modelo (ex: unsloth/Qwen2.5-Coder-3B-bnb-4bit)
            max_seq_length: Comprimento máximo de sequência
            dtype: Tipo de dados (float16, bfloat16)
            load_in_4bit: Usar quantização 4-bit
        """
        self.model_id = model_id
        self.max_seq_length = max_seq_length
        self.dtype = dtype
        self.load_in_4bit = load_in_4bit

    def load_model(self) -> Tuple:
        """
        Carrega modelo com FastLanguageModel (2-3x mais rápido).

        Returns:
            Tupla (model, tokenizer)
        """
        logger.info(f"📥 Carregando {self.model_id} com Unsloth...")

        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=self.model_id,
            max_seq_length=self.max_seq_length,
            dtype=self.dtype,
            load_in_4bit=self.load_in_4bit,
        )

        logger.info(f"✅ Modelo carregado")
        return model, tokenizer

    def setup_lora(self, model, rank: int = 16):
        """
        Configura LoRA para QLoRA fine-tuning.

        Args:
            model: Modelo carregado
            rank: Rank do adaptador

        Returns:
            Modelo com LoRA aplicado
        """
        logger.info("🔧 Configurando LoRA com Unsloth...")

        model = FastLanguageModel.get_peft_model(
            model,
            r=rank,
            lora_alpha=32,
            lora_dropout=0.05,
            bias="none",
            use_gradient_checkpointing="unsloth",
            random_state=42,
            target_modules=[
                "q_proj",
                "v_proj",
                "k_proj",
                "o_proj",
                "gate_proj",
                "up_proj",
                "down_proj",
            ],
        )

        model.print_trainable_parameters()
        return model

    @staticmethod
    def prepare_for_inference(model):
        """
        Prepara modelo para inferência (remove LoRA overhead).

        Args:
            model: Modelo com LoRA

        Returns:
            Modelo preparado para inferência
        """
        return FastLanguageModel.for_inference(model)


__all__ = ["UnslothModel"]
