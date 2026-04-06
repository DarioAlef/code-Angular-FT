# src/data/loader.py
import json
import logging
from pathlib import Path
from typing import Dict, List

from datasets import Dataset

from src.utils.config import settings

logger = logging.getLogger(__name__)

# Padrões obrigatórios que todo exemplo BaseComponent deve conter
REQUIRED_PATTERNS = ["extends BaseComponent", "createFormGroup", "Injector"]


def convert_to_conversation(item: Dict, system_prompt: str) -> Dict:
    """Converte formato antigo {instruction, response} para formato conversacional {messages}"""
    return {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": item["instruction"]},
            {"role": "assistant", "content": item["response"]},
        ]
    }


def is_valid_basecomponent(response: str) -> bool:
    """Verifica se a resposta contém os padrões obrigatórios do BaseComponent"""
    return all(pattern in response for pattern in REQUIRED_PATTERNS)


class DatasetLoader:
    """Carrega e processa dataset JSONL no formato conversacional"""

    @staticmethod
    def load_jsonl(file_path: Path) -> List[Dict]:
        """
        Carrega JSONL suportando formato antigo e novo.
        Formato antigo: {"instruction": "...", "response": "..."}
        Formato novo: {"messages": [{"role": "system", ...}, ...]}

        Converte automaticamente formato antigo para novo com system prompt.
        Filtra exemplos que não seguem o padrão BaseComponent.

        Returns:
            Lista de dicts com campo 'messages'
        """
        data = []
        filtered = 0
        converted = 0

        with open(file_path, "r", encoding="utf-8") as f:
            for line_num, line in enumerate(f, 1):
                if not line.strip():
                    continue

                item = json.loads(line)

                # Formato novo: já tem messages
                if "messages" in item:
                    data.append(item)
                    continue

                # Formato antigo: instruction/response -> converte
                if "instruction" in item and "response" in item:
                    # Filtra exemplos que não seguem padrão BaseComponent
                    if not is_valid_basecomponent(item["response"]):
                        filtered += 1
                        logger.debug(
                            f"Filtrado linha {line_num}: não contém padrão BaseComponent"
                        )
                        continue

                    data.append(
                        convert_to_conversation(item, settings.system_prompt)
                    )
                    converted += 1

        logger.info(f"✅ {len(data)} exemplos carregados de {file_path}")
        if converted:
            logger.info(f"   ↳ {converted} convertidos de formato antigo para conversacional")
        if filtered:
            logger.info(f"   ↳ {filtered} filtrados (não estendem BaseComponent)")

        return data

    @staticmethod
    def to_huggingface_dataset(data: List[Dict], split_ratio: float = 0.9) -> Dict:
        """
        Converte para HF Dataset com train/test split.
        Mantém a coluna 'messages' como lista de dicts.
        """
        dataset = Dataset.from_dict(
            {"messages": [item["messages"] for item in data]}
        )

        split = dataset.train_test_split(
            train_size=int(len(dataset) * split_ratio), seed=42
        )

        logger.info(
            f"📊 Train: {len(split['train'])}, Test: {len(split['test'])}"
        )
        return split


__all__ = ["DatasetLoader", "convert_to_conversation", "is_valid_basecomponent"]
