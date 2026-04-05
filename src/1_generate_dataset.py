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
import time
from pathlib import Path
from typing import Optional
import google.generativeai as genai
from utils.config import settings

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

# Substituir por sua chave de API
GEMINI_API_KEY = settings.GEMINI_API_KEY

# Padrão para detectar componentes que estendem BaseComponent
COMPONENT_PATTERN = r'export\s+class\s+(\w+)\s+extends\s+BaseComponent'

# Diretório raiz do skeleton-web
SKELETON_WEB_DIR = "skeleton-web/src/app"

# Arquivo de saída
OUTPUT_FILE = "dados_2026.jsonl"

# Modelo Gemini (Se falhar, use o script src/list_models.py para ver nomes corretos)
GEMINI_MODEL_NAME = "gemini-2.5-flash" 

# ============================================================================
# FUNÇÕES PRINCIPAIS
# ============================================================================

def setup_gemini(api_key: str):
    """Configura a API do Gemini."""
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(GEMINI_MODEL_NAME)

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
    try:
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
    except Exception as e:
        print(f"  ⚠️  Erro ao ler arquivo: {e}")

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

def save_sample(pair: dict, output_file: str):
    """Salva um único par no arquivo JSONL imediatamente."""
    item_clean = {k: v for k, v in pair.items() if k != 'source'}
    with open(output_file, 'a', encoding='utf-8') as f:
        f.write(json.dumps(item_clean, ensure_ascii=False) + "\n")

def process_components(root_dir: str, gemini_model, max_samples: Optional[int] = None):
    """
    Processa componentes e gera dataset com salvamento incremental.
    """
    component_files = find_component_files(root_dir)
    print(f"\n📂 Encontrados {len(component_files)} componentes")

    if max_samples:
        component_files = component_files[:max_samples]
        print(f"⚙️  Limitando a {max_samples} primeiros componentes")

    # Limpa o arquivo de saída antes de começar ou avisa que vai concatenar
    if os.path.exists(OUTPUT_FILE):
        print(f"⚠️  Arquivo {OUTPUT_FILE} já existe. Novos dados serão adicionados ao final.")

    count = 0
    try:
        for idx, file_path in enumerate(component_files, 1):
            print(f"\n[{idx}/{len(component_files)}] Processando: {file_path}")

            code = extract_component_code(file_path)
            if not code:
                print(f"  ⚠️  Não foi possível extrair classe BaseComponent")
                continue

            print(f"  ✅ Código extraído ({len(code)} caracteres)")
            code_truncated = truncate_code(code)

            instruction = None
            if gemini_model:
                instruction = generate_instruction_with_gemini(gemini_model, code_truncated)
                time.sleep(2) # Evitar rate limit da API gratuita

            if not instruction:
                print(f"  📝 Usando fallback para instrução")
                instruction = generate_instruction_fallback(file_path, code)

            pair = {
                "instruction": instruction,
                "response": code,
                "source": file_path
            }

            save_sample(pair, OUTPUT_FILE)
            count += 1
            print(f"  💾 Salvo com sucesso! ({count} total)")
            print(f"  📝 Instrução: {instruction[:70]}...")

    except KeyboardInterrupt:
        print("\n\n🛑 Processo interrompido pelo usuário!")
        print(f"✅ O progresso até agora ({count} exemplos) foi salvo em {OUTPUT_FILE}")

    return count

def main():
    print("🚀 Iniciando geração de dataset sintético...")
    print(f"🔑 API Key Gemini: {'✅ Configurada' if GEMINI_API_KEY else '❌ NÃO CONFIGURADA'}")

    if not os.path.exists(SKELETON_WEB_DIR):
        print(f"❌ Erro: Diretório {SKELETON_WEB_DIR} não encontrado")
        return

    if GEMINI_API_KEY:
        try:
            gemini_model = setup_gemini(GEMINI_API_KEY)
            print(f"✅ Gemini configurado (Modelo: {GEMINI_MODEL_NAME})")
        except Exception as e:
            print(f"⚠️  Erro ao configurar modelo: {e}. Usaremos fallback.")
            gemini_model = None
    else:
        print("⚠️  Chave Gemini não configurada. Usaremos fallback para instruções.")
        gemini_model = None

    total = process_components(SKELETON_WEB_DIR, gemini_model)

    print(f"\n✅ Processo concluído! Total de exemplos: {total}")
    print(f"📂 Arquivo gerado: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
