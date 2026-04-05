#!/usr/bin/env python3
"""
Script 2: Treina adaptador LoRA com Unsloth + Avalia ANTES/DEPOIS.

Uso:
    python scripts/2_train_and_infer.py --action train
    python scripts/2_train_and_infer.py --action infer
    python scripts/2_train_and_infer.py --action both

Fluxo TRAIN:
1. Carrega modelo Qwen 3B com FastLanguageModel (Unsloth)
2. Aplica LoRA (rank=16, alpha=32)
3. Carrega dataset JSONL com train/test split
4. Formata prompts no padrão Qwen chat
5. Treina com SFTTrainer (3 épocas, batch_size=4)
6. Salva adaptador em ./adapter_qlora_v2/

Fluxo INFER:
1. Carrega modelo base
2. Carrega modelo base + adaptador fine-tuned
3. Executa 10 prompts de teste em ambos
4. Compara respostas ANTES vs DEPOIS
5. Salva relatório em comparison_report.json

Objetivo:
- Qwen 3B agora gera código TypeScript herdando BaseComponent
- Modelo aprende padrão FPFtech da empresa
"""

import argparse
import logging
import sys
import torch
from pathlib import Path

# Adiciona src ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import settings
from src.data.loader import DatasetLoader
from src.models.inference import ModelInference
from src.models.unsloth_wrapper import UnslothModel
from src.training.trainer import QLoRATrainer
from src.utils.logging import setup_logging
from src.utils.paths import ProjectPaths


# Prompts de teste
TEST_PROMPTS = [
    "Crie um componente Angular para listar empresas com paginação",
    "Faça um componente que estende BaseComponent para gerenciar usuários",
    "Implemente busca com filtros em um componente Angular herdando BaseComponent",
    "Crie um formulário reativo que herda de BaseComponent com validação",
    "Faça um componente para deletar itens com confirmação de diálogo",
    "Implemente um componente para editar um usuário com salvamento",
    "Crie um componente para exportar dados em CSV",
    "Faça um componente com tabs e paginação estendendo BaseComponent",
    "Implemente um componente para gerenciar permissões de módulos",
    "Crie um componente tipo master-detail que estende BaseComponent",
]


def train_model():
    """Executa treinamento com Unsloth"""
    logger = setup_logging(level="INFO")

    logger.info("=" * 80)
    logger.info("🚀 TREINAMENTO COM UNSLOTH + QLORA")
    logger.info("=" * 80)
    logger.info(f"GPU: {torch.cuda.get_device_name() if torch.cuda.is_available() else 'CPU'}")

    # Carrega modelo
    logger.info("\n📥 Carregando modelo...")
    unsloth = UnslothModel(
        model_id=settings.model_id,
        max_seq_length=settings.max_seq_length
    )

    try:
        model, tokenizer = unsloth.load_model()
        model = unsloth.setup_lora(model, rank=settings.lora_rank)
        logger.info("✅ Modelo carregado com LoRA")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar modelo: {e}")
        return False

    # Carrega dataset
    logger.info("\n📂 Carregando dataset...")
    if not settings.dataset_file.exists():
        logger.error(f"❌ Dataset não encontrado: {settings.dataset_file}")
        logger.error("   Execute primeiro: python scripts/1_generate_dataset.py")
        return False

    try:
        data = DatasetLoader.load_jsonl(settings.dataset_file)
        dataset = DatasetLoader.to_huggingface_dataset(
            data, split_ratio=settings.train_split
        )
        logger.info("✅ Dataset carregado")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar dataset: {e}")
        return False

    # Treina
    logger.info("\n🔄 Iniciando treinamento...")
    ProjectPaths.ensure_dirs()

    try:
        trainer_obj = QLoRATrainer(
            output_dir=str(settings.output_dir),
            num_epochs=settings.num_epochs,
            batch_size=settings.batch_size,
            learning_rate=settings.learning_rate,
        )
        trainer = trainer_obj.train(model, tokenizer, dataset)
        logger.info("✅ Treinamento concluído")
    except Exception as e:
        logger.error(f"❌ Erro durante treinamento: {e}")
        return False

    # Salva adaptador
    logger.info(f"\n💾 Salvando adaptador em {settings.adapter_dir}...")
    try:
        ProjectPaths.ADAPTER.mkdir(parents=True, exist_ok=True)
        model.save_pretrained(str(settings.adapter_dir))
        logger.info("✅ Adaptador salvo")
    except Exception as e:
        logger.error(f"❌ Erro ao salvar adaptador: {e}")
        return False

    logger.info("\n" + "=" * 80)
    logger.info("✅ TREINAMENTO CONCLUÍDO COM SUCESSO!")
    logger.info("=" * 80)
    logger.info(f"\nPróximos passos:")
    logger.info(f"1. Execute inferência: python scripts/2_train_and_infer.py --action infer")

    return True


def infer_model():
    """Executa inferência e avaliação"""
    logger = setup_logging(level="INFO")

    logger.info("=" * 80)
    logger.info("📊 INFERÊNCIA: ANTES vs DEPOIS")
    logger.info("=" * 80)

    # Carrega modelo base
    logger.info("\n📥 Carregando modelo base...")
    try:
        base_inf = ModelInference(model_id=settings.model_id)
        base_inf.load_base_model()
        logger.info("✅ Modelo base carregado")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar modelo base: {e}")
        return False

    # Carrega modelo fine-tuned
    logger.info("\n📥 Carregando modelo fine-tuned...")
    if not settings.adapter_dir.exists():
        logger.error(f"❌ Adaptador não encontrado: {settings.adapter_dir}")
        logger.error("   Execute primeiro: python scripts/2_train_and_infer.py --action train")
        return False

    try:
        ft_inf = ModelInference(
            model_id=settings.model_id,
            adapter_path=str(settings.adapter_dir)
        )
        ft_inf.load_with_adapter()
        logger.info("✅ Modelo fine-tuned carregado")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar modelo fine-tuned: {e}")
        return False

    # Executa comparação
    logger.info("\n🧪 Executando testes de comparação...")
    try:
        results = ft_inf.compare_models(base_inf, ft_inf, TEST_PROMPTS)
        logger.info("✅ Testes executados")
    except Exception as e:
        logger.error(f"❌ Erro durante testes: {e}")
        return False

    # Salva relatório
    logger.info(f"\n💾 Salvando relatório em {settings.comparison_report_file}...")
    try:
        ModelInference.save_comparison_report(results, settings.comparison_report_file)
        logger.info("✅ Relatório salvo")
    except Exception as e:
        logger.error(f"❌ Erro ao salvar relatório: {e}")
        return False

    logger.info("\n" + "=" * 80)
    logger.info("✅ INFERÊNCIA CONCLUÍDA COM SUCESSO!")
    logger.info("=" * 80)
    logger.info(f"\nArtefatos gerados:")
    logger.info(f"1. {settings.comparison_report_file} - Comparação ANTES/DEPOIS")

    return True


def main(action: str = "both"):
    """
    Executa o pipeline.

    Args:
        action: 'train', 'infer' ou 'both'
    """
    if action in ["train", "both"]:
        if not train_model():
            return False

    if action in ["infer", "both"]:
        if not infer_model():
            return False

    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Treina e avalia modelo com Unsloth + Inferência"
    )
    parser.add_argument(
        "--action",
        choices=["train", "infer", "both"],
        default="both",
        help="Ação a executar (train, infer, both)"
    )
    args = parser.parse_args()

    success = main(action=args.action)
    sys.exit(0 if success else 1)
