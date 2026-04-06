# src/data/validator.py
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


class DatasetValidator:
    """Valida qualidade do dataset gerado (formato conversacional)"""

    @staticmethod
    def validate(dataset: List[Dict]) -> bool:
        """
        Valida dataset no formato conversacional {messages: [...]}.
        Também suporta formato antigo {instruction, response} para retrocompatibilidade.
        """
        logger.info(f"🔍 Validando dataset com {len(dataset)} exemplos...")

        if len(dataset) == 0:
            logger.error("❌ Dataset vazio!")
            return False

        for idx, item in enumerate(dataset):
            # Formato novo: messages
            if "messages" in item:
                messages = item["messages"]
                if not isinstance(messages, list) or len(messages) < 2:
                    logger.error(f"❌ Exemplo {idx}: messages deve ter pelo menos 2 entradas")
                    return False

                roles = [m.get("role") for m in messages]
                if "assistant" not in roles:
                    logger.error(f"❌ Exemplo {idx}: falta role 'assistant'")
                    return False

                assistant_content = next(
                    m["content"] for m in messages if m["role"] == "assistant"
                )
                if not assistant_content.strip():
                    logger.error(f"❌ Exemplo {idx}: resposta do assistant vazia")
                    return False

            # Formato antigo: instruction/response
            elif "instruction" in item and "response" in item:
                if not item["instruction"].strip():
                    logger.warning(f"⚠️  Exemplo {idx} tem instrução vazia")
                if not item["response"].strip():
                    logger.error(f"❌ Exemplo {idx} tem resposta vazia")
                    return False
            else:
                logger.error(f"❌ Exemplo {idx}: formato desconhecido (nem messages nem instruction/response)")
                return False

        logger.info(f"✅ Dataset válido! {len(dataset)} exemplos")
        return True

    @staticmethod
    def print_stats(dataset: List[Dict]):
        """Imprime estatísticas do dataset."""
        instructions = []
        responses = []

        for item in dataset:
            if "messages" in item:
                for m in item["messages"]:
                    if m["role"] == "user":
                        instructions.append(m["content"])
                    elif m["role"] == "assistant":
                        responses.append(m["content"])
            else:
                instructions.append(item.get("instruction", ""))
                responses.append(item.get("response", ""))

        avg_instruction_len = sum(len(i) for i in instructions) / max(len(instructions), 1)
        avg_response_len = sum(len(r) for r in responses) / max(len(responses), 1)

        has_system = sum(
            1 for item in dataset
            if "messages" in item and any(m["role"] == "system" for m in item["messages"])
        )

        logger.info(f"\n📊 ESTATÍSTICAS DO DATASET:")
        logger.info(f"   Total de exemplos: {len(dataset)}")
        logger.info(f"   Com system prompt: {has_system}/{len(dataset)}")
        logger.info(f"   Tamanho médio instrução: {avg_instruction_len:.0f} chars")
        logger.info(f"   Tamanho médio resposta: {avg_response_len:.0f} chars")


__all__ = ["DatasetValidator"]
