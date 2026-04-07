#!/usr/bin/env python3
"""
Script 2: Treina adaptador LoRA com Unsloth + Avalia ANTES/DEPOIS.

Uso:
    python scripts/train_and_infer.py --action train
    python scripts/train_and_infer.py --action infer
    python scripts/train_and_infer.py --action both
"""

import argparse
import sys
import torch
import gc
from src.utils.config import settings
from src.preprocessing_dataset.loader import DatasetLoader
from src.models.unsloth_wrapper import UnslothModel
from src.models.inference import ModelInference
from src.training.trainer import QLoRATrainer
from src.utils.logging import setup_logging
import os

os.environ["CUDA_VISIBLE_DEVICES"] = settings.cuda_visible_devices

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
    logger.info("🚀 TREINAMENTO COM UNSLOTH + QLORA (v2 - Corrigido)")
    logger.info("=" * 80)
    logger.info(f"GPU: {torch.cuda.get_device_name() if torch.cuda.is_available() else 'CPU'}")
    logger.info(f"Modelo: {settings.model_id}")
    logger.info(f"LR: {settings.training.learning_rate} | Épocas: {settings.training.num_epochs} | Batch: {settings.training.batch_size}")
    logger.info(f"LoRA: r={settings.lora.rank}, alpha={settings.lora.alpha}, dropout={settings.lora.dropout}")

    logger.info("\n📥 Carregando modelo...")
    unsloth = UnslothModel(
        model_id=settings.model_id,
        max_seq_length=settings.training.max_seq_length
    )

    try:
        model, tokenizer = unsloth.load_model()
        model = unsloth.setup_lora(
            model,
            rank=settings.lora.rank,
            alpha=settings.lora.alpha,
            dropout=settings.lora.dropout,
        )
        logger.info("✅ Modelo carregado com LoRA")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar modelo: {e}")
        return False

    logger.info("\n📂 Carregando dataset...")
    dataset_path = settings.paths.dataset_file
    if not dataset_path.exists():
        logger.error(f"❌ Dataset não encontrado: {dataset_path}")
        logger.error("   Execute primeiro: python scripts/dataset/generate_dataset.py")
        return False

    try:
        data = DatasetLoader.load_jsonl(dataset_path)
        dataset = DatasetLoader.to_huggingface_dataset(
            data, split_ratio=settings.training.train_split
        )
        logger.info("✅ Dataset carregado (formato conversacional com system prompt)")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar dataset: {e}")
        return False

    logger.info("\n🔄 Iniciando treinamento...")
    settings.paths.ensure_dirs()

    try:
        trainer_obj = QLoRATrainer(
            config=settings.training,
            output_dir=settings.paths.output_dir,
        )
        trainer = trainer_obj.train(model, tokenizer, dataset)
        logger.info("✅ Treinamento concluído")
    except Exception as e:
        logger.error(f"❌ Erro durante treinamento: {e}")
        return False

    logger.info(f"\n💾 Salvando adaptador + tokenizer em {settings.paths.adapter_dir}...")
    try:
        settings.paths.adapter_dir.mkdir(parents=True, exist_ok=True)
        model.save_pretrained(str(settings.paths.adapter_dir))
        tokenizer.save_pretrained(str(settings.paths.adapter_dir))
        logger.info("✅ Adaptador e tokenizer salvos")
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
    """Executa inferência e avaliação sequencialmente para poupar VRAM"""
    logger = setup_logging(level="INFO")

    logger.info("=" * 80)
    logger.info("📊 INFERÊNCIA: ANTES vs DEPOIS (v2)")
    logger.info("=" * 80)

    logger.info("\n📥 Carregando modelo base...")
    base_responses = []
    try:
        base_inf = ModelInference(model_id=settings.model_id, load_in_4bit=True)
        base_inf.load_base_model()
        logger.info("✅ Modelo base carregado")

        logger.info("🧪 Gerando respostas com modelo BASE...")
        for i, prompt in enumerate(TEST_PROMPTS, 1):
            logger.info(f"  [{i}/{len(TEST_PROMPTS)}] BASE...")
            base_responses.append(base_inf.generate_code(prompt, max_tokens=settings.inference_max_tokens))

        del base_inf
        torch.cuda.empty_cache()
        gc.collect()
        logger.info("🧹 Memória do modelo base liberada")
    except Exception as e:
        logger.error(f"❌ Erro no modelo base: {e}")
        return False

    logger.info("\n📥 Carregando modelo fine-tuned...")
    if not settings.paths.adapter_dir.exists():
        logger.error(f"❌ Adaptador não encontrado: {settings.paths.adapter_dir}")
        return False

    ft_responses = []
    try:
        ft_inf = ModelInference(
            model_id=settings.model_id,
            adapter_path=str(settings.paths.adapter_dir),
            load_in_4bit=True
        )
        ft_inf.load_with_adapter()
        logger.info("✅ Modelo fine-tuned carregado")

        logger.info("🧪 Gerando respostas com modelo FINE-TUNED...")
        for i, prompt in enumerate(TEST_PROMPTS, 1):
            logger.info(f"  [{i}/{len(TEST_PROMPTS)}] FINE-TUNED...")
            ft_responses.append(ft_inf.generate_code(prompt, max_tokens=settings.inference_max_tokens))
    except Exception as e:
        logger.error(f"❌ Erro no modelo fine-tuned: {e}")
        return False

    results = []
    for prompt, base, ft in zip(TEST_PROMPTS, base_responses, ft_responses):
        results.append({
            "prompt": prompt,
            "base_response": base,
            "ft_response": ft
        })

        logger.info(f"\n📝 PROMPT: {prompt}")
        logger.info(f"✅ BASE: {base[:100]}...")
        logger.info(f"✅ FINE-TUNED: {ft[:100]}...")

    logger.info(f"\n💾 Salvando relatório em {settings.paths.comparison_report}...")
    try:
        ModelInference.save_comparison_report(results, settings.paths.comparison_report)
        logger.info("✅ Relatório salvo")
    except Exception as e:
        logger.error(f"❌ Erro ao salvar relatório: {e}")
        return False

    logger.info("\n" + "=" * 80)
    logger.info("✅ INFERÊNCIA CONCLUÍDA COM SUCESSO!")
    logger.info("=" * 80)

    return True


def main(action: str = "both"):
    if action in ["train", "both"]:
        if not train_model():
            return False

    if action in ["infer", "both"]:
        if not infer_model():
            return False

    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Treina e avalia modelo com Unsloth + Inferência (v2)"
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
