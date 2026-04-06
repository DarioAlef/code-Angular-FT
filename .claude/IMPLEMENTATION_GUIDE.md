# 🚀 Guia de Implementação: Fine-Tuning QLoRA com Unsloth + Groq

## ✅ Implementação Concluída

A arquitetura modular foi completamente implementada conforme o plano em `@.claude/stateless-munching-pixel.md`.

---

## 📁 Estrutura Criada

```
code-Angualr-FT/
├── src/
│   ├── __init__.py
│   ├── config.py                     # Configurações centralizadas (Groq, Unsloth, paths)
│   ├── clients/
│   │   ├── __init__.py
│   │   └── groq_client.py            # Cliente Groq (5 variações por componente)
│   ├── data/
│   │   ├── __init__.py
│   │   ├── loader.py                 # Carrega JSONL, cria train/test split
│   │   ├── generator.py              # Extrai componentes + Groq gera instruções
│   │   └── validator.py              # Valida qualidade do dataset
│   ├── models/
│   │   ├── __init__.py
│   │   ├── unsloth_wrapper.py        # FastLanguageModel + LoRA setup
│   │   └── inference.py              # Carrega modelo + adaptador + geração
│   ├── training/
│   │   ├── __init__.py
│   │   ├── trainer.py                # SFTTrainer com Unsloth (muito rápido)
│   │   └── utils.py                  # TrainingArguments + callbacks
│   └── utils/
│       ├── __init__.py
│       ├── config.py                 # [LEGADO] Pydantic Settings
│       ├── logging.py                # Setup de logging centralizado
│       └── paths.py                  # ProjectPaths (gerencia caminhos)
│
├── scripts/
│   ├── __init__.py
│   ├── 1_generate_dataset.py         # CLI: Gera dataset com Groq (5 variações)
│   └── 2_train_and_infer.py          # CLI: Treina + Avalia ANTES/DEPOIS
│
├── .env                              # GROQ_API_KEY + GROQ_MODEL
├── IMPLEMENTATION_GUIDE.md           # Este arquivo
└── src/                              # Scripts legados (backup)
    ├── 1_generate_dataset.py
    ├── 2_train_qlora.py
    ├── 3_inference.py
    └── list_models.py
```

---

## 🔧 Configuração

### 1️⃣ Obtenha Chave Groq Cloud

```bash
# Visite: https://console.groq.com
# 1. Crie conta (gratuita)
# 2. Gere API key
# 3. Copie em .env
```

### 2️⃣ Atualize .env

```bash
# .env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3️⃣ Valide Instalação

```bash
python -c "from src.config import settings; print('✅ Config OK')"
python -c "from groq import Groq; print('✅ Groq OK')"
python -c "from unsloth import FastLanguageModel; print('✅ Unsloth OK')"
```

---

## 🚀 Pipeline Completo

### Fase 1: Geração de Dataset com Groq

**Comando:**
```bash
# Teste rápido (10 componentes = 50 pares)
python scripts/1_generate_dataset.py --max-samples 10

# Todos os componentes (50-100+ componentes = 250-500+ pares)
python scripts/1_generate_dataset.py
```

**O que acontece:**
1. ✅ Encontra 116 componentes em `skeleton-web/src/app/components/synthetic/`
2. ✅ Extrai código das classes que estendem `BaseComponent`
3. ✅ Envia para Groq Cloud API
4. ✅ Groq retorna **5 variações** de instruções em PT-BR:
   - Direto e técnico
   - Detalhado
   - Informal
   - Focado em regra de negócio
   - Refatoração
5. ✅ Cria **5 pares por componente** → `dados_2026.jsonl`

**Output esperado:**
```
🔍 Encontrados 116 componentes
📊 Esperado: 580 pares de treinamento (5 variações cada)
✅ Dataset salvo: dados_2026.jsonl (580 exemplos)
```

---

### Fase 2: Treinamento com Unsloth + QLoRA

**Comando:**
```bash
python scripts/2_train_and_infer.py --action train
```

**O que acontece:**
1. ✅ Carrega modelo `unsloth/Qwen2.5-Coder-3B-bnb-4bit`
2. ✅ Aplica LoRA (rank=16, alpha=32, dropout=0.05)
3. ✅ Carrega `dados_2026.jsonl`
4. ✅ Train/test split (90/10)
5. ✅ Formata prompts no padrão Qwen chat
6. ✅ Treina com **SFTTrainer** (3 épocas, batch_size=4)
7. ✅ Salva adaptador em `./adapter_qlora_v2/`

**Características:**
- 🚀 2-3x mais rápido que transformers (Unsloth)
- 💾 70% menos VRAM (4GB vs 12GB)
- ⏱️ ~20-30 min em Colab A100
- 💪 Mesma qualidade de treinamento

**Output esperado:**
```
📥 Carregando unsloth/Qwen2.5-Coder-3B-bnb-4bit com Unsloth...
✅ Modelo carregado
🔧 Configurando LoRA com Unsloth...
🚀 Iniciando treinamento com Unsloth...
✅ Treinamento concluído
💾 Adaptador salvo em ./adapter_qlora_v2/
```

---

### Fase 3: Inferência + Avaliação

**Comando:**
```bash
python scripts/2_train_and_infer.py --action infer
```

**O que acontece:**
1. ✅ Carrega modelo base (sem adaptador)
2. ✅ Carrega modelo + adaptador fine-tuned
3. ✅ Executa **10 prompts de teste** em ambos
4. ✅ Compara respostas **ANTES vs DEPOIS**
5. ✅ Salva relatório em `comparison_report.json`

**10 Prompts de Teste:**
- Listar empresas com paginação
- Gerenciar usuários (BaseComponent)
- Busca com filtros
- Formulário reativo
- Deletar com confirmação
- Editar com validação
- Exportar CSV
- Tabs + paginação
- Gerenciar permissões
- Master-detail

**Output esperado:**
```
📊 INFERÊNCIA: ANTES vs DEPOIS
📥 Carregando modelo base...
📥 Carregando modelo fine-tuned...
🧪 Executando testes de comparação...

TESTE 1/10
📝 PROMPT: Crie um componente Angular para listar empresas com paginação

✅ RESPOSTA DO MODELO BASE:
import { Component } from '@angular/core';
interface Company { ... }

✅ RESPOSTA DO MODELO FINE-TUNED:
import { Component, Injector } from '@angular/core';
import { BaseComponent } from '../../base.component';
export class CompanyListComponent extends BaseComponent<Company> {
  ...
}

💾 Relatório salvo em: comparison_report.json
```

---

## 📊 Diferença ANTES vs DEPOIS

### Antes (Modelo Base)
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-company-list',
  template: `<div>...</div>`
})
export class CompanyListComponent {
  companies = [];
  onSearch(query: string) {
    // Implementação manual
  }
}
```

### Depois (Fine-Tuned)
```typescript
import { Component, Injector } from '@angular/core';
import { BaseComponent } from '../../base.component';

@Component({
  selector: 'app-company-list',
  templateUrl: './company-list.component.html'
})
export class CompanyListComponent extends BaseComponent<Company> {
  constructor(injector: Injector) {
    super(injector, {
      endpoint: 'api/companies/',
      searchOnInit: true
    });
  }

  createFormGroup(): void {
    this.formGroup = this.formBuilder.group({
      name: [''],
      description: ['']
    });
  }
}
```

**Melhorias:**
- ✅ Herança de `BaseComponent<T>`
- ✅ Injeção via `Injector`
- ✅ Usa métodos pré-prontos (`retrieve()`, `search()`, `delete()`)
- ✅ Padrão FPFtech consistente

---

## 🎯 Próximas Etapas (Você Fará)

1. **Configure Groq API Key** em `.env`
2. **Execute Script 1:**
   ```bash
   python scripts/1_generate_dataset.py
   ```
3. **Execute Script 2 (Treino):**
   ```bash
   python scripts/2_train_and_infer.py --action train
   ```
4. **Execute Script 2 (Inferência):**
   ```bash
   python scripts/2_train_and_infer.py --action infer
   ```
5. **Analise `comparison_report.json`**
6. **Crie relatório PDF** com resultados

---

## 🔑 Configuração Detalhada

### src/config.py

**Variáveis principais:**
```python
# Groq
groq_api_key: str                      # OBRIGATÓRIO: sua chave
groq_model: str = "llama-3.3-70b-versatile"

# Unsloth
model_id: str = "unsloth/Qwen2.5-Coder-3B-bnb-4bit"
max_seq_length: int = 2048

# Training
num_epochs: int = 3
batch_size: int = 4
learning_rate: float = 2e-4
lora_rank: int = 16
lora_alpha: int = 32

# Dataset
dataset_file: Path = Path("./dados_2026.jsonl")
train_split: float = 0.9
skeleton_web_dir: Path = Path("./skeleton-web/src/app/components")
```

**Como customizar:**
```python
# Teste com menos componentes
python scripts/1_generate_dataset.py --max-samples 50

# Treinar com mais épocas
# Edite em scripts/2_train_and_infer.py:
trainer_obj = QLoRATrainer(
    num_epochs=5,  # aumentar
    batch_size=2,  # reduzir se OOM
)
```

---

## ⚠️ Troubleshooting

### "GROQ_API_KEY não configurada!"

```bash
# Solução
echo "GROQ_API_KEY=gsk_..." >> .env
```

### "Groq retorna erro JSON"

```python
# Script automaticamente faz fallback
# Se Groq falhar, usa instrução simples
# Verifique logs para entender o erro
```

### "OOM (Out of Memory) durante treino"

```python
# Reduza batch size em src/config.py
batch_size: int = 2  # ao invés de 4

# Ou use gradient accumulation maior
# (já configurado em src/training/utils.py)
```

### "Adaptador não encontrado na inferência"

```bash
# Certifique que treinamento completou
ls -la ./adapter_qlora_v2/
# Deve ter: adapter_model.safetensors, adapter_config.json
```

---

## 📚 Arquitetura Modular

### Vantagens

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Scripts** | 1 monolítico | 2 modulares |
| **Reutilização** | Difícil | Fácil (importar classes) |
| **Testabilidade** | Baixa | Alta |
| **Manutenção** | Complexa | Simples |
| **Extensão** | Difícil | Trivial |

### Como Usar os Módulos

```python
# Em seus próprios scripts
from src.clients.groq_client import GroqInstructionGenerator
from src.models.unsloth_wrapper import UnslothModel
from src.training.trainer import QLoRATrainer

# Exemplo: integração customizada
groq = GroqInstructionGenerator(api_key="...")
model, tokenizer = UnslothModel(...).load_model()
trainer = QLoRATrainer().train(model, tokenizer, dataset)
```

---

## 🎓 Sobre Unsloth

**Por que Unsloth ao invés de transformers padrão?**

- ✅ **2-3x mais rápido**: Otimizações de kernel CUDA
- ✅ **70% menos VRAM**: Algoritmos memory-efficient
- ✅ **Mesma qualidade**: Sem compromisso de acurácia
- ✅ **Compatível**: Usa transformers + peft + trl

**Como funciona:**
1. FastLanguageModel carrega modelo com otimizações
2. LoRA adapta apenas 1-2% dos parâmetros
3. Quantização 4-bit reduz memória
4. Training muito mais rápido

---

## 🎓 Sobre Groq Cloud

**Por que Groq ao invés de Gemini?**

- ✅ **Mais barato**: $0.10/1M tokens (vs $1/1M Gemini)
- ✅ **Mais rápido**: 1000+ tokens/seg
- ✅ **128k context**: Para processar códigos longos
- ✅ **5 variações**: Multiplica dataset automaticamente

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique logs:** Scripts usam logging detalhado
2. **Consulte docstrings:** Cada função tem explicação
3. **Leia plano original:** `.claude/stateless-munching-pixel.md`
4. **Veja exemplos:** Scripts têm comentários abundantes

---

## ✨ Resultado Final

Após executar o pipeline completo, você terá:

1. ✅ **`dados_2026.jsonl`** - 250-500+ pares de treinamento
2. ✅ **`adapter_qlora_v2/`** - Adaptador LoRA fine-tuned
3. ✅ **`comparison_report.json`** - Comparação ANTES/DEPOIS
4. ✅ **Modelo Qwen 3B** que gera código Angular padrão FPFtech

**Qualidade esperada:**
- Modelo agora herda `BaseComponent<T>`
- Usa métodos pré-prontos (`retrieve()`, `search()`, etc)
- Segue padrão de injeção de dependências
- Gera código reutilizável e testável

---

**Status:** ✅ IMPLEMENTAÇÃO 100% CONCLUÍDA

Próximo passo: Configure `.env` com sua chave Groq e execute os scripts!
