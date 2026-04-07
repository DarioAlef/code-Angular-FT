import logging
from transformers import TrainingArguments
from src.utils.config import TrainingConfig

logger = logging.getLogger(__name__)


def get_training_args(
    config: TrainingConfig,
    output_dir: str,
) -> TrainingArguments:
    """
    Retorna argumentos de treinamento otimizados.
    Baseado na TrainingConfig do settings.
    """
    return TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=config.num_epochs,
        max_steps=config.max_steps,
        per_device_train_batch_size=config.batch_size,
        per_device_eval_batch_size=config.batch_size,
        gradient_accumulation_steps=config.gradient_accumulation_steps,
        learning_rate=config.learning_rate,
        lr_scheduler_type="cosine",
        warmup_steps=10,
        logging_steps=10,
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        optim="adamw_8bit",
        seed=config.seed,
        fp16=False,
        bf16=True,
        weight_decay=0.05,
        max_grad_norm=1.0,
        report_to="none",
    )


__all__ = ["get_training_args"]
