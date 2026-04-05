# src/training/trainer.py
import logging
from typing import Dict

from trl import SFTTrainer

from src.training.utils import get_training_args

logger = logging.getLogger(__name__)


class QLoRATrainer:
    """Treina adaptador LoRA com Unsloth (muito mais rápido)"""

    def __init__(
        self,
        output_dir: str = "./checkpoints",
        num_epochs: int = 3,
        batch_size: int = 4,
        learning_rate: float = 2e-4,
    ):
        """
        Inicializa o trainer.

        Args:
            output_dir: Diretório de checkpoints
            num_epochs: Número de épocas
            batch_size: Batch size
            learning_rate: Learning rate
        """
        self.output_dir = output_dir
        self.num_epochs = num_epochs
        self.batch_size = batch_size
        self.learning_rate = learning_rate

    def train(self, model, tokenizer, dataset) -> SFTTrainer:
        """
        Executa treinamento com Unsloth.

        Args:
            model: Modelo com LoRA aplicado
            tokenizer: Tokenizador
            dataset: Dataset com train/test split

        Returns:
            Trainer executado
        """
        logger.info("🚀 Iniciando treinamento com Unsloth...")

        training_args = get_training_args(
            output_dir=self.output_dir,
            num_epochs=self.num_epochs,
            batch_size=self.batch_size,
            learning_rate=self.learning_rate,
        )

        # Formata dataset
        logger.info("📝 Formatando dataset...")
        dataset_formatted = dataset.map(
            lambda x: {"text": self._format_prompt(x)},
            batched=True,
            remove_columns=dataset["train"].column_names,
        )

        trainer = SFTTrainer(
            model=model,
            tokenizer=tokenizer,
            args=training_args,
            train_dataset=dataset_formatted["train"],
            eval_dataset=dataset_formatted["test"],
            dataset_text_field="text",
            max_seq_length=2048,
            packing=True,
        )

        trainer.train()
        logger.info("✅ Treinamento concluído")
        return trainer

    @staticmethod
    def _format_prompt(example: Dict) -> str:
        """
        Formata prompt no padrão Qwen.

        Args:
            example: Exemplo com instruction e response

        Returns:
            Prompt formatado
        """
        return f"""<|im_start|>user
{example['instruction']}<|im_end|>
<|im_start|>assistant
{example['response']}<|im_end|>"""


__all__ = ["QLoRATrainer"]
