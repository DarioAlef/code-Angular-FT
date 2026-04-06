# 🚀 Setup do Projeto - Guia Passo a Passo

## ✅ Correções Aplicadas

### 1. Conflito de Versão Resolvido
**Problema anterior:**
```
transformers>=4.43.0,<4.50.0  ← incompatível com unsloth 2026.4.2
```

**Solução:**
```toml
# pyproject.toml
transformers>=4.51.3,<=5.5.0  # ← compatível com unsloth 2026.4.2
trl>=0.8.0                    # ← sem limite superior
unsloth[colab-new] @ git+... # ← do repositório oficial
```

### 2. Diretórios Atualizados
**Antes:**
```python
skeleton_web_dir = Path("skeleton-web/src/app/components")  # ← 145 comp
```

**Depois:**
```python
components_dir = Path("data/datasets")  # ← 290+ componentes
```

### 3. Groq Otimizado para 5 Instruções
**Parâmetros:**
- `max_completion_tokens: 512` — apenas 5 instruções
- `temperature: 0.7` — mais variação entre instruções
- `delay_seconds: 0.5` — respeita rate limit

---

## 📋 Como Instalar/Atualizar

### Option A: Usando `uv` (recomendado)
```bash
cd /home/dario/Github/code-Angualr-FT
uv sync
```

### Option B: Usando `pip` (se uv falhar)
```bash
cd /home/dario/Github/code-Angualr-FT

# Remove venv antigo
rm -rf .venv

# Cria novo venv
python3 -m venv .venv
source .venv/bin/activate

# Instala dependências
pip install -e .
```

---

## 🏃 Executar Pipeline Completo

### Opção 1: Tudo junto
```bash
python scripts/0_full_pipeline.py
```

### Opção 2: Passo a passo
```bash
# 1. Gera dataset (290+ componentes × 5 instruções = 1450+ pares)
python scripts/1_generate_dataset.py

# 2. Treina modelo
python scripts/2_train_and_infer.py --action train

# 3. Executa inferência
python scripts/2_train_and_infer.py --action infer
```

---

## 📊 Mudanças no Dataset

| Métrica | Antes | Depois |
|---------|-------|--------|
| Fonte | skeleton-web (145) | /data/datasets (290+) |
| Componentes | 145 | 290+ |
| Instruções por comp | 5 | 5 |
| **Total de pares** | **725** | **1450+** |
| Groq tokens/comp | 250 | 200 (reduzido) |

---

## ✨ O Que Muda

### Arquivo de Dataset
```jsonl
# Antes: dados_2026.jsonl com 725 linhas
# Depois: dados_2026.jsonl com 1450+ linhas

{
  "instruction": "Crie um componente Angular para...",
  "response": "import { Component, Injector... } export class..."
}
```

### Qualidade de Treinamento
- ✅ **Mais dados**: 2x mais componentes
- ✅ **Mais variação**: 5 instruções diferentes por componente
- ✅ **Mais economical**: menos tokens Groq por componente

---

## 🔍 Verificar Instalação

```bash
# Verifica versões
python -c "import transformers, trl, unsloth; print(f'transformers: {transformers.__version__}'); print(f'trl: {trl.__version__}')"

# Verifica dataset
ls -lh dados_2026.jsonl

# Verifica componentes disponíveis
ls data/datasets/*.component.ts | wc -l
```

---

## 🆘 Se ainda tiver erro

### Erro: "No solution found when resolving dependencies"
```bash
# Limpa cache de uv
uv cache clean

# Tenta sync novamente
uv sync
```

### Erro: "ImportError: cannot import name 'ConstantLengthDataset'"
```bash
# Remove venv e reinstala
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

---

## 📝 Arquivos Modificados

1. ✅ `pyproject.toml` — Versões corrigidas
2. ✅ `src/config.py` — Paths atualizados para /data/datasets
3. ✅ `src/data/generator.py` — Busca em /data/datasets
4. ✅ `src/clients/groq_client.py` — max_tokens ajustado para 512

---

**Status:** ✅ Pronto para executar
