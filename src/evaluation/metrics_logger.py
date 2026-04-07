# src/evaluation/metrics_logger.py
import json
import logging
from pathlib import Path
from typing import Dict, List
from transformers import TrainerCallback, TrainerState, TrainerControl

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

logger = logging.getLogger(__name__)


class MetricsLoggerCallback(TrainerCallback):
    """Callback customizado que salva métricas de treino por época e por step"""

    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.metrics_by_epoch: Dict[int, Dict] = {}
        self.all_steps: List[Dict] = []
        self.current_epoch = 0
        self.epoch_step_counter = {}

    def on_log(self, args, state: TrainerState, control: TrainerControl, logs=None, **kwargs):
        """Chamado sempre que o Trainer gera um log (logging_steps)"""
        if logs:
            step_data = {
                "step": state.global_step,
                "epoch": round(state.epoch, 4) if state.epoch else self.current_epoch,
            }
            
            # Captura métricas de treino
            if "loss" in logs:
                step_data["train_loss"] = logs["loss"]
            if "learning_rate" in logs:
                step_data["learning_rate"] = logs["learning_rate"]
            if "grad_norm" in logs:
                step_data["grad_norm"] = logs["grad_norm"]
            
            # Captura métricas de avaliação (se houver)
            if "eval_loss" in logs:
                step_data["eval_loss"] = logs["eval_loss"]
            
            if any(k in step_data for k in ["train_loss", "eval_loss", "grad_norm"]):
                self.all_steps.append(step_data)

    def on_epoch_end(self, args, state: TrainerState, control: TrainerControl, **kwargs):
        """Chamado ao final de cada época"""
        epoch_num = int(round(state.epoch)) if state.epoch else self.current_epoch + 1
        self.current_epoch = epoch_num

        epoch_metrics = {
            "epoch": epoch_num,
            "step": state.global_step,
        }

        # Tenta pegar o último log de treino e avaliação
        if state.log_history:
            # Busca reversa pelo último log que tenha os dados
            for log in reversed(state.log_history):
                if "loss" in log and "train_loss" not in epoch_metrics:
                    epoch_metrics["train_loss"] = log["loss"]
                if "learning_rate" in log and "learning_rate" not in epoch_metrics:
                    epoch_metrics["learning_rate"] = log["learning_rate"]
                if "grad_norm" in log and "grad_norm" not in epoch_metrics:
                    epoch_metrics["grad_norm"] = log["grad_norm"]
                if "eval_loss" in log and "eval_loss" not in epoch_metrics:
                    epoch_metrics["eval_loss"] = log["eval_loss"]
                
                # Para de procurar se já temos os principais
                if all(k in epoch_metrics for k in ["train_loss", "learning_rate", "grad_norm"]):
                    break

        self.metrics_by_epoch[epoch_num] = epoch_metrics

        # Log visual no console
        train_loss = epoch_metrics.get("train_loss", "N/A")
        eval_loss = epoch_metrics.get("eval_loss", "N/A")
        lr = epoch_metrics.get("learning_rate", "N/A")

        t_loss_str = f"{train_loss:.4f}" if isinstance(train_loss, (int, float)) else "N/A"
        e_loss_str = f"{eval_loss:.4f}" if isinstance(eval_loss, (int, float)) else "N/A"

        logger.info(f"📊 Época {epoch_num} concluída: Step {state.global_step} | Loss Treino: {t_loss_str} | Loss Eval: {e_loss_str} | LR: {lr}")

    def on_train_end(self, args, state: TrainerState, control: TrainerControl, **kwargs):
        """Chamado ao final do treino"""
        self._save_metrics()

    def _save_metrics(self):
        """Salva todas as métricas em arquivos JSON e CSV"""

        # 1. Métricas por época (JSON)
        epoch_file = self.output_dir / "training_metrics_by_epoch.json"
        with open(epoch_file, "w", encoding="utf-8") as f:
            json.dump(self.metrics_by_epoch, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ Métricas por época salvas em: {epoch_file}")

        # 2. Todos os steps (JSON)
        if self.all_steps:
            steps_file = self.output_dir / "training_metrics_all_steps.json"
            with open(steps_file, "w", encoding="utf-8") as f:
                json.dump(self.all_steps, f, indent=2, ensure_ascii=False)
            logger.info(f"✅ Métricas de todos os steps salvas em: {steps_file}")

        # 3. Epochs em CSV (para Excel/análise) - opcional, requer pandas
        if HAS_PANDAS and self.metrics_by_epoch:
            try:
                epochs_df = pd.DataFrame.from_dict(
                    self.metrics_by_epoch, orient='index'
                ).reset_index(drop=True)
                epochs_csv = self.output_dir / "training_metrics_by_epoch.csv"
                epochs_df.to_csv(epochs_csv, index=False)
                logger.info(f"✅ Métricas por época (CSV) salvas em: {epochs_csv}")
            except Exception as e:
                logger.warning(f"⚠️ Não foi possível salvar CSV de épocas: {e}")

        # 4. Todos os steps em CSV - opcional, requer pandas
        if HAS_PANDAS and self.all_steps:
            try:
                steps_df = pd.DataFrame(self.all_steps)
                steps_csv = self.output_dir / "training_metrics_all_steps.csv"
                steps_df.to_csv(steps_csv, index=False)
                logger.info(f"✅ Métricas de steps (CSV) salvas em: {steps_csv}")
            except Exception as e:
                logger.warning(f"⚠️ Não foi possível salvar CSV de steps: {e}")

        # 5. Resumo (JSON)
        summary = self._generate_summary()
        summary_file = self.output_dir / "training_summary.json"
        with open(summary_file, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        logger.info(f"✅ Resumo de treino salvo em: {summary_file}")

    def _generate_summary(self) -> Dict:
        """Gera resumo estatístico do treino"""
        if not self.metrics_by_epoch:
            return {}

        epochs_data = list(self.metrics_by_epoch.values())
        train_losses = [e.get("train_loss") for e in epochs_data if e.get("train_loss")]
        eval_losses = [e.get("eval_loss") for e in epochs_data if e.get("eval_loss")]
        learning_rates = [e.get("learning_rate") for e in epochs_data if e.get("learning_rate")]

        summary = {
            "total_epochs": len(self.metrics_by_epoch),
            "total_steps": self.metrics_by_epoch.get(
                len(self.metrics_by_epoch), {}
            ).get("step", 0),
            "train_loss": {
                "initial": float(train_losses[0]) if train_losses else None,
                "final": float(train_losses[-1]) if train_losses else None,
                "min": float(min(train_losses)) if train_losses else None,
                "max": float(max(train_losses)) if train_losses else None,
            },
            "eval_loss": {
                "initial": float(eval_losses[0]) if eval_losses else None,
                "final": float(eval_losses[-1]) if eval_losses else None,
                "min": float(min(eval_losses)) if eval_losses else None,
                "max": float(max(eval_losses)) if eval_losses else None,
            },
            "learning_rate": {
                "initial": float(learning_rates[0]) if learning_rates else None,
                "final": float(learning_rates[-1]) if learning_rates else None,
            }
        }
        return summary


__all__ = ["MetricsLoggerCallback"]
