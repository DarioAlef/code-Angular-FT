# src/data/validator.py
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


class DatasetValidator:
    """Valida qualidade do dataset gerado"""

    @staticmethod
    def validate(dataset: List[Dict]) -> bool:
        """
        Valida dataset.

        Args:
            dataset: Lista de dicts com instruction e response

        Returns:
            True se válido, False caso contrário
        """
        logger.info(f"🔍 Validando dataset com {len(dataset)} exemplos...")

        if len(dataset) == 0:
            logger.error("❌ Dataset vazio!")
            return False

        # Verifica campos obrigatórios
        for idx, item in enumerate(dataset):
            if "instruction" not in item or "response" not in item:
                logger.error(
                    f"❌ Exemplo {idx} não tem fields obrigatórios"
                )
                return False

            if not item["instruction"].strip():
                logger.warning(f"⚠️  Exemplo {idx} tem instrução vazia")

            if not item["response"].strip():
                logger.error(
                    f"❌ Exemplo {idx} tem resposta vazia"
                )
                return False

        logger.info(f"✅ Dataset válido! {len(dataset)} exemplos")
        return True

    @staticmethod
    def print_stats(dataset: List[Dict]):
        """
        Imprime estatísticas do dataset.

        Args:
            dataset: Lista de dicts
        """
        avg_instruction_len = sum(
            len(item["instruction"]) for item in dataset
        ) / len(dataset)
        avg_response_len = sum(
            len(item["response"]) for item in dataset
        ) / len(dataset)

        logger.info(f"\n📊 ESTATÍSTICAS DO DATASET:")
        logger.info(f"   Total de exemplos: {len(dataset)}")
        logger.info(f"   Tamanho médio instrução: {avg_instruction_len:.0f} chars")
        logger.info(f"   Tamanho médio resposta: {avg_response_len:.0f} chars")


__all__ = ["DatasetValidator"]
