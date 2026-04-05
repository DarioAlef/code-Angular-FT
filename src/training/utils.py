# src/training/utils.py
import logging

from transformers import TrainerCallback, TrainingArguments

logger = logging.getLogger(__name__)


class LoggingCallback(TrainerCallback):
    """Callback customizado para logging detalhado"""

    def on_step_end(self, args, state, control, **kwargs):
        """Chamado ao final de cada step"""
        if state.global_step % args.logging_steps == 0:
            logger.info(
                f"Step {state.global_step} | Loss: {state.log_history[-1]['loss']:.4f}"
            )

    def on_evaluate(self, args, state, control, metrics=None, **kwargs):
        """Chamado ao final da avaliação"""
        if metrics:
            logger.info(f"Evaluation results: {metrics}")


def get_training_args(
    output_dir: str,
    num_epochs: int = 3,
    batch_size: int = 4,
    learning_rate: float = 2e-4,
) -> TrainingArguments:
    """
    Retorna argumentos de treinamento.

    Args:
        output_dir: Diretório de saída
        num_epochs: Número de épocas
        batch_size: Batch size
        learning_rate: Learning rate

    Returns:
        TrainingArguments configurado
    """
    return TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=num_epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size,
        gradient_accumulation_steps=4,
        learning_rate=learning_rate,
        lr_scheduler_type="cosine",
        warmup_steps=100,
        logging_steps=10,
        save_steps=50,
        save_total_limit=3,
        optim="adamw_8bit",
        seed=42,
        fp16=False,
        bf16=True,
        weight_decay=0.01,
        max_grad_norm=1.0,
    )


__all__ = ["LoggingCallback", "get_training_args"]
