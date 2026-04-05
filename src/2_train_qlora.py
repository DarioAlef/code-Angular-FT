#!/usr/bin/env python3
"""
Script para fazer fine-tuning com QLoRA do modelo Qwen 2.5 Coder.

Arquitetura:
- Modelo base: Qwen 2.5 Coder 7B (4-bit quantizado)
- Adaptador: LoRA (Low-Rank Adaptation)
- Dataset: dados_2026.jsonl
- Output: adapter_model.bin + adapter_config.json
"""

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer
from datasets import load_dataset
import json
import os

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

MODEL_ID = "Qwen/Qwen2.5-Coder-7B"  # Modelo base
ADAPTER_OUTPUT = "./adapter_qlora"   # Pasta para salvar adaptador
DATASET_FILE = "dados_2026.jsonl"    # Dataset de treinamento

# Configuração QLoRA
QLORA_CONFIG = {
    "load_in_4bit": True,                    # Quantizar para 4-bit
    "bnb_4bit_quant_type": "nf4",            # Tipo de quantização
    "bnb_4bit_compute_dtype": torch.bfloat16, # Tipo computacional
    "bnb_4bit_use_double_quant": True,       # Double quantização
}

# Configuração LoRA
LORA_CONFIG = {
    "r": 16,                     # Rank do adaptador (tamanho)
    "lora_alpha": 32,            # Alpha (escala)
    "lora_dropout": 0.05,        # Dropout
    "bias": "none",
    "task_type": "CAUSAL_LM",    # Tarefa: language modeling
    "target_modules": [          # Módulos a adaptar
        "q_proj",
        "v_proj",
        "k_proj",
        "o_proj",
        "gate_proj",
        "up_proj",
        "down_proj",
    ],
}

# Configuração de Treinamento
TRAINING_CONFIG = {
    "output_dir": "./checkpoints",
    "num_train_epochs": 3,              # 3 épocas
    "per_device_train_batch_size": 4,   # Batch size (ajuste se GPU pequena)
    "gradient_accumulation_steps": 4,   # Acumula gradientes
    "learning_rate": 2e-4,              # Taxa de aprendizado
    "lr_scheduler_type": "cosine",      # Scheduler
    "warmup_steps": 100,
    "save_steps": 50,                   # Salva checkpoint a cada 50 passos
    "save_total_limit": 3,              # Mantém apenas 3 checkpoints
    "logging_steps": 10,
    "optim": "paged_adamw_8bit",        # Otimizador memory-efficient
    "seed": 42,
    "fp16": False,
    "bf16": True,                       # Usa bfloat16 se disponível
}

# ============================================================================
# FUNÇÕES
# ============================================================================

def load_model_and_tokenizer(model_id: str):
    """Carrega modelo e tokenizador."""
    print(f"📥 Carregando modelo: {model_id}")

    # Configuração BitsAndBytes para quantização 4-bit
    bnb_config = BitsAndBytesConfig(**QLORA_CONFIG)

    # Carrega modelo quantizado
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )

    # Carrega tokenizador
    tokenizer = AutoTokenizer.from_pretrained(
        model_id,
        trust_remote_code=True,
    )

    # Padding token
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    print(f"✅ Modelo carregado (tamanho: {model.get_memory_footprint() / 1e9:.2f}GB)")

    return model, tokenizer

def setup_lora(model):
    """Configura e aplica LoRA ao modelo."""
    print(f"🔧 Configurando LoRA...")

    lora_config = LoraConfig(
        r=LORA_CONFIG["r"],
        lora_alpha=LORA_CONFIG["lora_alpha"],
        lora_dropout=LORA_CONFIG["lora_dropout"],
        bias=LORA_CONFIG["bias"],
        task_type=LORA_CONFIG["task_type"],
        target_modules=LORA_CONFIG["target_modules"],
    )

    # Aplica LoRA ao modelo
    model = get_peft_model(model, lora_config)

    # Exibe estatísticas de parâmetros
    model.print_trainable_parameters()

    return model

def load_dataset_jsonl(file_path: str, split_ratio: float = 0.9):
    """
    Carrega dataset JSONL e cria train/test split.
    """
    print(f"📂 Carregando dataset: {file_path}")

    # Lê JSONL
    data = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))

    print(f"✅ {len(data)} exemplos carregados")

    # Cria dataset Hugging Face
    from datasets import Dataset

    dataset = Dataset.from_dict({
        "instruction": [item["instruction"] for item in data],
        "response": [item["response"] for item in data],
    })

    # Train/test split
    dataset = dataset.train_test_split(
        train_size=int(len(dataset) * split_ratio),
        seed=42
    )

    print(f"📊 Split:")
    print(f"   Train: {len(dataset['train'])} exemplos")
    print(f"   Test: {len(dataset['test'])} exemplos")

    return dataset

def format_chat_template(examples):
    """
    Formata exemplos no padrão de chat do Qwen.
    """
    formatted_prompts = []

    for instruction, response in zip(examples["instruction"], examples["response"]):
        # Template: <|im_start|>user\n{instruction}<|im_end|>\n<|im_start|>assistant\n{response}<|im_end|>
        prompt = f"""<|im_start|>user
{instruction}<|im_end|>
<|im_start|>assistant
{response}<|im_end|>"""
        formatted_prompts.append(prompt)

    return {"text": formatted_prompts}

def train_model(model, tokenizer, dataset):
    """Executa o treinamento."""
    print(f"\n🚀 Iniciando treinamento...")

    # Configura argumentos de treinamento
    training_args = TrainingArguments(
        **TRAINING_CONFIG
    )

    # Formata dataset
    print(f"📝 Formatando dataset...")
    dataset_formatted = dataset.map(
        format_chat_template,
        batched=True,
        remove_columns=dataset["train"].column_names,
    )

    # Cria trainer
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        args=training_args,
        train_dataset=dataset_formatted["train"],
        eval_dataset=dataset_formatted["test"],
        dataset_text_field="text",
        max_seq_length=2048,
        packing=True,  # Empacotar exemplos para eficiência
    )

    # Executa treinamento
    trainer.train()

    print(f"\n✅ Treinamento concluído!")

    return trainer

def save_adapter(model, trainer, output_dir: str):
    """Salva o adaptador treinado."""
    print(f"\n💾 Salvando adaptador em: {output_dir}")

    # Salva apenas o adaptador (muito menor que modelo completo)
    model.save_pretrained(output_dir)

    print(f"✅ Adaptador salvo!")
    print(f"   - adapter_model.bin")
    print(f"   - adapter_config.json")

def main():
    print("="*80)
    print("QLoRA Fine-Tuning: Qwen 2.5 Coder → Código Angular FPFtech")
    print("="*80)

    # Verifica se dataset existe
    if not os.path.exists(DATASET_FILE):
        print(f"❌ Erro: Dataset {DATASET_FILE} não encontrado. Execute 1_generate_dataset.py primeiro.")
        return

    # Carrega modelo e tokenizador
    model, tokenizer = load_model_and_tokenizer(MODEL_ID)

    # Configura LoRA
    model = setup_lora(model)

    # Carrega dataset
    dataset = load_dataset_jsonl(DATASET_FILE)

    # Treina
    trainer = train_model(model, tokenizer, dataset)

    # Salva adaptador
    save_adapter(model, trainer, ADAPTER_OUTPUT)

    print("\n" + "="*80)
    print("✅ PROCESSO DE TREINAMENTO CONCLUÍDO!")
    print("="*80)
    print(f"\nPróximos passos:")
    print(f"1. Teste o modelo com: 3_inference.py")
    print(f"2. Compare respostas ANTES vs DEPOIS")
    print(f"3. Gere relatório de avaliação")

if __name__ == "__main__":
    main()
