# src/training/trainer.py
import logging
from pathlib import Path
from transformers import EarlyStoppingCallback
from trl import SFTTrainer
from unsloth.chat_templates import train_on_responses_only

from src.training.utils import get_training_args
from src.utils.config import TrainingConfig

logger = logging.getLogger(__name__)


class QLoRATrainer:
    """Treina adaptador LoRA com Unsloth usando chat template nativo"""

    def __init__(self, config: TrainingConfig, output_dir: Path):
        self.config = config
        self.output_dir = str(output_dir)

    def train(self, model, tokenizer, dataset) -> SFTTrainer:
        """
        Executa treinamento com Unsloth.
        Usa apply_chat_template para formatar e train_on_responses_only para mascarar loss.

        Args:
            model: Modelo com LoRA aplicado
            tokenizer: Tokenizador (já com chat template aplicado)
            dataset: Dataset com train/test split (coluna 'messages')

        Returns:
            Trainer executado
        """
        logger.info("🚀 Iniciando treinamento com Unsloth...")

        training_args = get_training_args(
            config=self.config,
            output_dir=self.output_dir,
        )

        # Formata dataset usando apply_chat_template nativo
        logger.info("📝 Formatando dataset com apply_chat_template...")
        dataset_formatted = dataset.map(
            lambda examples: self._format_with_chat_template(examples, tokenizer),
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
            max_seq_length=self.config.max_seq_length,
            packing=False,
            callbacks=[EarlyStoppingCallback(early_stopping_patience=self.config.early_stopping_patience)],
        )

        # CRÍTICO: Mascara loss nos tokens system/user (treina APENAS nas respostas)
        trainer = train_on_responses_only(
            trainer,
            instruction_part="<|im_start|>user\n",
            response_part="<|im_start|>assistant\n",
        )
        logger.info("✅ train_on_responses_only aplicado (loss apenas nas respostas)")

        trainer.train()
        logger.info("✅ Treinamento concluído")
        return trainer

    @staticmethod
    def _format_with_chat_template(examples: dict, tokenizer) -> dict:
        """Formata batch de mensagens usando tokenizer.apply_chat_template"""
        texts = []
        for messages in examples["messages"]:
            text = tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=False
            )
            texts.append(text)
        return {"text": texts}


__all__ = ["QLoRATrainer"]
