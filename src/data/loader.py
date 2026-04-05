# src/data/loader.py
import json
import logging
from pathlib import Path
from typing import Dict, List

from datasets import Dataset

logger = logging.getLogger(__name__)


class DatasetLoader:
    """Carrega e processa dataset JSONL"""

    @staticmethod
    def load_jsonl(file_path: Path) -> List[Dict]:
        """
        Carrega JSONL.

        Args:
            file_path: Caminho do arquivo JSONL

        Returns:
            Lista de dicts com instruction e response
        """
        data = []
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    data.append(json.loads(line))

        logger.info(f"✅ {len(data)} exemplos carregados de {file_path}")
        return data

    @staticmethod
    def to_huggingface_dataset(
        data: List[Dict], split_ratio: float = 0.9
    ) -> Dict:
        """
        Converte para HF Dataset com train/test split.

        Args:
            data: Lista de dicts
            split_ratio: Proporção train (padrão 90%)

        Returns:
            Dict com 'train' e 'test' datasets
        """
        dataset = Dataset.from_dict(
            {
                "instruction": [item["instruction"] for item in data],
                "response": [item["response"] for item in data],
            }
        )

        split = dataset.train_test_split(
            train_size=int(len(dataset) * split_ratio), seed=42
        )

        logger.info(
            f"📊 Train: {len(split['train'])}, Test: {len(split['test'])}"
        )
        return split

    @staticmethod
    def format_prompts(examples: Dict) -> Dict:
        """
        Formata no padrão Qwen chat.

        Args:
            examples: Batch de exemplos

        Returns:
            Dict com 'text' formatado
        """
        prompts = []
        for instruction, response in zip(examples["instruction"], examples["response"]):
            prompt = f"""<|im_start|>user
{instruction}<|im_end|>
<|im_start|>assistant
{response}<|im_end|>"""
            prompts.append(prompt)
        return {"text": prompts}


__all__ = ["DatasetLoader"]
