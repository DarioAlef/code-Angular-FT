#!/usr/bin/env python3
"""
Script para fazer inferência com o modelo fine-tuned.
Compara respostas ANTES (modelo base) vs DEPOIS (com adaptador).
"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel
import json
import os

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

MODEL_ID = "Qwen/Qwen2.5-Coder-3B-Instruct"
ADAPTER_PATH = "./adapter_qlora"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Configuração de quantização para inferência (economia de VRAM)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

# Prompts de teste (10 exemplos)
TEST_PROMPTS = [
    "Crie um componente Angular para listar empresas com paginação",
    "Faça um componente que estende BaseComponent para gerenciar usuários",
    "Implemente um componente de visualização de detalhes de um produto",
    "Crie um formulário reativo que herda de BaseComponent",
    "Faça um componente para deletar itens com confirmação de diálogo",
    "Implemente busca com filtros em um componente Angular",
    "Crie um componente para exportar dados em CSV",
    "Faça um componente com tabs e paginação estendendo BaseComponent",
    "Implemente um componente para editar um usuário com validação",
    "Crie um componente para gerenciar permissões de módulos"
]

# ============================================================================
# FUNÇÕES
# ============================================================================

def load_base_model(model_id: str):
    """Carrega modelo base (sem adaptador)."""
    print(f"📥 Carregando modelo base: {model_id}")

    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )

    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    return model, tokenizer

def load_finetuned_model(model_id: str, adapter_path: str):
    """Carrega modelo com adaptador LoRA."""
    print(f"📥 Carregando modelo base: {model_id}")
    print(f"🔧 Aplicando adaptador: {adapter_path}")

    # Carrega modelo base quantizado
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )

    # Aplica adaptador
    model = PeftModel.from_pretrained(model, adapter_path)

    # Merge (opcional, mais rápido para inferência)
    # model = model.merge_and_unload()

    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    return model, tokenizer

def generate_code(model, tokenizer, prompt: str, max_tokens: int = 512) -> str:
    """Gera código dado um prompt."""

    # Formata prompt no padrão do Qwen
    formatted_prompt = f"""<|im_start|>user
{prompt}<|im_end|>
<|im_start|>assistant
"""

    # Tokeniza
    inputs = tokenizer.encode(formatted_prompt, return_tensors="pt").to(DEVICE)

    # Gera
    with torch.no_grad():
        outputs = model.generate(
            inputs,
            max_new_tokens=max_tokens,
            temperature=0.1,  # Determinístico
            top_p=0.9,
            do_sample=False,  # Greedy decoding
            pad_token_id=tokenizer.eos_token_id,
        )

    # Decodifica
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Remove o prompt do output
    response = response.replace(formatted_prompt, "").strip()

    return response

def compare_models(base_model, base_tokenizer, ft_model, ft_tokenizer, prompts: list[str]):
    """
    Compara saídas do modelo base vs fine-tuned.
    """
    results = []

    for idx, prompt in enumerate(prompts, 1):
        print(f"\n{'='*80}")
        print(f"TESTE {idx}/{len(prompts)}")
        print(f"{'='*80}")
        print(f"\n📝 PROMPT:\n{prompt}\n")

        # Modelo base
        print(f"⏳ Gerando com modelo BASE...")
        base_response = generate_code(base_model, base_tokenizer, prompt)

        # Modelo fine-tuned
        print(f"⏳ Gerando com modelo FINE-TUNED...")
        ft_response = generate_code(ft_model, ft_tokenizer, prompt)

        # Exibe respostas
        print(f"\n✅ RESPOSTA DO MODELO BASE (primeiros 500 chars):")
        print(f"{base_response[:500]}")
        print(f"\n{'─'*80}\n")

        print(f"✅ RESPOSTA DO MODELO FINE-TUNED (primeiros 500 chars):")
        print(f"{ft_response[:500]}")

        # Armazena para relatório
        results.append({
            "prompt": prompt,
            "base_response": base_response,
            "ft_response": ft_response,
        })

    return results

def save_comparison_report(results: list[dict], output_file: str = "comparison_report.json"):
    """Salva relatório de comparação."""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Relatório salvo em: {output_file}")

def main():
    print("="*80)
    print("AVALIAÇÃO: Comparação ANTES vs DEPOIS do Fine-Tuning")
    print("="*80)

    # Verifica se adaptador existe
    if not os.path.exists(ADAPTER_PATH):
        print(f"❌ Erro: Adaptador em {ADAPTER_PATH} não encontrado. Execute 2_train_qlora.py primeiro.")
        return

    # Carrega modelos
    print("\n📥 CARREGANDO MODELOS...")
    base_model, base_tokenizer = load_base_model(MODEL_ID)

    print("\n📥 CARREGANDO MODELO FINE-TUNED...")
    ft_model, ft_tokenizer = load_finetuned_model(MODEL_ID, ADAPTER_PATH)

    # Executa testes
    print("\n🧪 EXECUTANDO TESTES...")
    results = compare_models(base_model, base_tokenizer, ft_model, ft_tokenizer, TEST_PROMPTS)

    # Salva relatório
    save_comparison_report(results)

    print("\n" + "="*80)
    print("✅ AVALIAÇÃO CONCLUÍDA!")
    print("="*80)

if __name__ == "__main__":
    main()
