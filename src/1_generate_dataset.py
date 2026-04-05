#!/usr/bin/env python3
"""
Script para gerar dataset sintético a partir de componentes Angular existentes.

Processo:
1. Procura todos os .component.ts no skeleton-web
2. Extrai código relevante (classe que estende BaseComponent)
3. Envia para Gemini para gerar instrução em português
4. Salva pares (instruction, response) em dados_2026.jsonl
"""

import os
import json
import re
from pathlib import Path
import google.generativeai as genai
from typing import Optional

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

# Substituir por sua chave de API (obtenha em https://makersuite.google.com/app/apikeys)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-api-key-here")

# Padrão para detectar componentes que estendem BaseComponent
COMPONENT_PATTERN = r'export\s+class\s+(\w+)\s+extends\s+BaseComponent'

# Diretório raiz do skeleton-web
SKELETON_WEB_DIR = "./skeleton-web/src/app"

# Arquivo de saída
OUTPUT_FILE = "dados_2026.jsonl"

# ============================================================================
# FUNÇÕES PRINCIPAIS
# ============================================================================

def setup_gemini(api_key: str):
    """Configura a API do Gemini."""
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-pro")

def find_component_files(root_dir: str) -> list[str]:
    """
    Encontra todos os .component.ts no diretório.
    Ignora node_modules.
    """
    components = []
    for root, dirs, files in os.walk(root_dir):
        # Ignora node_modules
        if "node_modules" in root:
            continue

        for file in files:
            if file.endswith(".component.ts"):
                components.append(os.path.join(root, file))

    return sorted(components)

def extract_component_code(file_path: str) -> Optional[str]:
    """
    Extrai o código da classe que estende BaseComponent.
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Procura a classe que estende BaseComponent
    match = re.search(
        r'(export\s+class\s+\w+\s+extends\s+BaseComponent.*?(?=\n^(?:export|import|\Z)))',
        content,
        re.MULTILINE | re.DOTALL
    )

    if match:
        return match.group(0).strip()

    return None

def truncate_code(code: str, max_length: int = 2000) -> str:
    """Trunca código se muito longo (Gemini tem limites)."""
    if len(code) > max_length:
        return code[:max_length] + "\n... (truncado)"
    return code

def generate_instruction_with_gemini(model, component_code: str) -> Optional[str]:
    """
    Envia código para Gemini e gera instrução em português.
    """
    prompt = f"""Você é um expert em Angular. Analise o código abaixo que é um componente Angular que estende BaseComponent.

Componente Angular:
```typescript
{component_code}
```

Seu objetivo: Gere UMA instrução em português natural (como um desenvolvedor pediria) que resultaria EXATAMENTE neste código.

Instrução (sem quebras, apenas um parágrafo):"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip() if response else None
    except Exception as e:
        print(f"  ⚠️  Erro ao chamar Gemini: {e}")
        return None

def generate_instruction_fallback(file_path: str, component_code: str) -> str:
    """
    Fallback quando Gemini falha: gera instrução baseada no nome do arquivo.
    """
    file_name = Path(file_path).stem.replace(".component", "")

    # Converte kebab-case para Título Case
    title = " ".join(word.capitalize() for word in file_name.split("-"))

    # Heurística: se tem MatPaginator, é lista; se tem retrieve, é detalhe
    if "MatPaginator" in component_code:
        return f"Crie um componente Angular para listar {title.lower()} com paginação e busca"
    elif "retrieve" in component_code:
        return f"Crie um componente Angular para visualizar e editar um {title.lower()}"
    else:
        return f"Crie um componente Angular chamado {title}"

def process_components(root_dir: str, gemini_model, max_samples: Optional[int] = None):
    """
    Processa todos os componentes e gera dataset.
    """
    component_files = find_component_files(root_dir)

    print(f"\n📂 Encontrados {len(component_files)} componentes")

    if max_samples:
        component_files = component_files[:max_samples]
        print(f"⚙️  Limitando a {max_samples} primeiros componentes para teste")

    dataset = []

    for idx, file_path in enumerate(component_files, 1):
        print(f"\n[{idx}/{len(component_files)}] Processando: {file_path}")

        # Extrai código da classe
        code = extract_component_code(file_path)
        if not code:
            print(f"  ⚠️  Não foi possível extrair classe BaseComponent")
            continue

        print(f"  ✅ Código extraído ({len(code)} caracteres)")

        # Trunca se necessário
        code_truncated = truncate_code(code)

        # Gera instrução com Gemini
        instruction = None
        if gemini_model:
            instruction = generate_instruction_with_gemini(gemini_model, code_truncated)

        # Fallback se Gemini falhar ou não estiver configurado
        if not instruction:
            print(f"  📝 Usando fallback para instrução")
            instruction = generate_instruction_fallback(file_path, code)

        # Cria par (instruction, response)
        pair = {
            "instruction": instruction,
            "response": code,
            "source": file_path  # Útil para debugging
        }

        dataset.append(pair)
        print(f"  📝 Instrução: {instruction[:80]}...")

    return dataset

def save_dataset(dataset: list[dict], output_file: str):
    """
    Salva dataset em formato JSONL (uma linha por exemplo).
    """
    with open(output_file, 'w', encoding='utf-8') as f:
        for item in dataset:
            # Remove campo 'source' antes de salvar
            item_clean = {k: v for k, v in item.items() if k != 'source'}
            f.write(json.dumps(item_clean, ensure_ascii=False) + "\n")

    print(f"\n✅ Dataset salvo em: {output_file}")
    print(f"   Total de exemplos: {len(dataset)}")

def display_samples(dataset: list[dict], num_samples: int = 3):
    """Exibe alguns exemplos do dataset."""
    print(f"\n{'='*80}")
    print(f"PREVIEW: Primeiros {min(num_samples, len(dataset))} exemplos")
    print(f"{'='*80}\n")

    for idx, item in enumerate(dataset[:num_samples], 1):
        print(f"EXEMPLO {idx}:")
        print(f"  📝 Instrução:\n    {item['instruction']}")
        print(f"\n  💻 Resposta (primeiros 300 chars):\n    {item['response'][:300]}...")
        print(f"\n{'-'*80}\n")

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("🚀 Iniciando geração de dataset sintético...")
    print(f"🔑 API Key Gemini: {'✅ Configurada' if GEMINI_API_KEY != 'your-api-key-here' else '❌ NÃO CONFIGURADA'}")

    # Verifica se diretório existe
    if not os.path.exists(SKELETON_WEB_DIR):
        print(f"❌ Erro: Diretório {SKELETON_WEB_DIR} não encontrado")
        return

    # Configura Gemini
    if GEMINI_API_KEY != "your-api-key-here":
        gemini_model = setup_gemini(GEMINI_API_KEY)
        print("✅ Gemini configurado")
    else:
        print("⚠️  Chave Gemini não configurada. Usaremos fallback para instruções.")
        gemini_model = None

    # Processa componentes (limita a 10 para teste rápido)
    dataset = process_components(SKELETON_WEB_DIR, gemini_model, max_samples=10)

    if not dataset:
        print("❌ Nenhum componente foi processado!")
        return

    # Salva dataset
    save_dataset(dataset, OUTPUT_FILE)

    # Exibe preview
    display_samples(dataset)

    print("✅ Processo concluído!")

if __name__ == "__main__":
    main()
