#!/usr/bin/env python3
"""
Script 1: Gera dataset extraindo componentes Angular + instruções via Groq Cloud.

Uso:
    python scripts/1_generate_dataset.py --max-samples 10
    python scripts/1_generate_dataset.py                    # Todos

Fluxo:
1. Encontra componentes em skeleton-web/src/app/components/synthetic/
2. Extrai código das classes que estendem BaseComponent
3. Envia para Groq Cloud API
4. Groq retorna 5 variações de instruções em PT-BR
5. Cria 5 pares (instruction, response) por componente
6. Salva em dados_2026.jsonl

Resultado esperado:
- 50 componentes × 5 variações = 250 pares
- 100 componentes × 5 variações = 500 pares
"""

import argparse
import logging
import sys
from pathlib import Path

# Adiciona src ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.clients.groq_client import GroqInstructionGenerator
from src.config import settings
from src.data.generator import DatasetGenerator
from src.data.validator import DatasetValidator
from src.utils.logging import setup_logging
from src.utils.paths import ProjectPaths


def main(max_samples: int = None):
    """
    Executa geração de dataset.

    Args:
        max_samples: Número máximo de componentes a processar
    """
    # Setup
    logger = setup_logging(level="INFO")
    ProjectPaths.ensure_dirs()

    logger.info("=" * 80)
    logger.info("GERAÇÃO DE DATASET COM GROQ + VARIAÇÕES")
    logger.info("=" * 80)

    # Valida API key
    if not settings.groq_api_key:
        logger.error("❌ GROQ_API_KEY não configurada no .env!")
        return False

    logger.info(f"✅ Usando: {settings.groq_model}")

    # Inicializa Groq (carrega .env automaticamente)
    try:
        groq = GroqInstructionGenerator()
        logger.info("✅ Groq cliente inicializado")
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar Groq: {e}")
        return False

    # Gera dataset
    generator = DatasetGenerator(groq)

    try:
        logger.info("\n🔄 Gerando dataset...")
        dataset = generator.generate_dataset(max_samples=max_samples)
    except Exception as e:
        logger.error(f"❌ Erro ao gerar dataset: {e}")
        return False

    if not dataset:
        logger.error("❌ Nenhum componente foi processado!")
        return False

    # Valida dataset
    if not DatasetValidator.validate(dataset):
        logger.error("❌ Dataset falhou na validação!")
        return False

    # Imprime estatísticas
    DatasetValidator.print_stats(dataset)

    # Salva
    try:
        generator.save(dataset, settings.dataset_file)
        logger.info(f"\n✅ Dataset salvo em: {settings.dataset_file}")
    except Exception as e:
        logger.error(f"❌ Erro ao salvar dataset: {e}")
        return False

    # Preview
    logger.info("\n" + "=" * 80)
    logger.info(f"PREVIEW: Primeiros 2 exemplos")
    logger.info("=" * 80)
    for idx, item in enumerate(dataset[:2], 1):
        logger.info(f"\nEXEMPLO {idx}:")
        logger.info(f"  📝 Instrução: {item['instruction'][:100]}...")
        logger.info(f"  💻 Resposta: {item['response'][:150]}...")

    logger.info("\n" + "=" * 80)
    logger.info("✅ GERAÇÃO DE DATASET CONCLUÍDA COM SUCESSO!")
    logger.info("=" * 80)
    logger.info(f"\nPróximos passos:")
    logger.info(f"1. Verifique {settings.dataset_file}")
    logger.info(f"2. Execute: python scripts/2_train_and_infer.py --action train")

    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Gera dataset com Groq Cloud API"
    )
    parser.add_argument(
        "--max-samples",
        type=int,
        default=None,
        help="Número máximo de componentes a processar (teste rápido)"
    )
    args = parser.parse_args()

    success = main(max_samples=args.max_samples)
    sys.exit(0 if success else 1)
