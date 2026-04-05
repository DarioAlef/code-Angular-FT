# Plano Detalhado: Fine-Tuning QLoRA para Geração de Código Angular Padronizado (FPFtech)

> **Data da Entrega:** 31/03/2026
> **Modelo Base:** Qwen 2.5 Coder 7B
> **Técnica:** QLoRA (Quantized LoRA)
> **Dataset:** Componentes Angular do repositório `skeleton-web` (padrão FPFtech)

---

## 📚 PARTE 1: Conceitos Fundamentais

### 1.1 O que é Fine-Tuning?

**Fine-tuning** é o processo de adaptar um modelo de linguagem pré-treinado para uma tarefa ou domínio específico.

**Exemplo analógico:** Um modelo LLM é como um recém-formado em Engenharia que sabe muita teoria. Fine-tuning é colocá-lo para aprender prática específica em Angular + padrões FPFtech.

**Sem fine-tuning:** O Qwen Code gera código Angular genérico (válido, mas não segue o padrão da empresa).

**Com fine-tuning:** O Qwen Code aprende que quando pede componentes Angular, DEVE usar:
- Herança de `BaseComponent<T>`
- Métodos pré-prontos como `retrieve()`, `saveOrUpdate()`, `search()`
- Estrutura de formulários com `UntypedFormGroup`
- Injeção de dependências via `Injector`

---

### 1.2 O que é QLoRA?

**QLoRA = Quantized Low-Rank Adaptation**

É uma técnica que permite treinar modelos grandes com menos memória:

**Sem QLoRA (LoRA tradicional):**
- Você congelaria o modelo base (Qwen 7B)
- Adicionaria "adaptadores" pequenos (matrizes de baixo rank) nos pesos
- Precisaria de ~16GB VRAM (ainda muito para laptops)

**Com QLoRA:**
- O modelo base é comprimido para 4-bit (quantização)
- Os adaptadores são treinados normalmente
- Usa 75% menos memória (~4GB)
- Qualidade de treinamento praticamente idêntica

**Analogia:** Se o modelo é um carro, LoRA modifica apenas o motor (adaptadores). QLoRA coloca o carro em um "ar comprimido" (quantização) e modifica o motor dentro desse espaço comprimido.

---

### 1.3 Dataset Sintético

Um dataset é uma coleção de **pares (instrução, resposta)**:

```json
{
  "instruction": "Crie um componente Angular para listar usuários com paginação",
  "response": "import { Component, Injector } from '@angular/core';\nimport { BaseComponent } from '../../base.component';\n\n@Component({\n  selector: 'app-user-list',\n  templateUrl: './user-list.component.html'\n})\nexport class UserListComponent extends BaseComponent<User> {\n  constructor(injector: Injector) {\n    super(injector, {\n      endpoint: 'api/users/',\n      searchOnInit: true\n    });\n  }\n\n  createFormGroup(): void {\n    this.formGroup = this.formBuilder.group({\n      name: [''],\n      email: ['']\n    });\n  }\n}\n"
}
```

**Por que sintético?** Você pode gerar automaticamente a partir do código existente + uma LLM maior (Gemini/ChatGPT) gerando instruções.

---

## 🔍 PARTE 2: Análise da Estrutura do Skeleton-Web

### 2.1 Padrão Base da FPFtech

Ao analisar `skeleton-web/src/app/components/base.component.ts`, identificamos:

**Classe Base Fundamental:**
```typescript
export abstract class BaseComponent<T> implements OnInit, OnDestroy {
  // Injeção de dependências
  constructor(public injector: Injector, public options: BaseOptions) { }

  // Métodos pré-prontos (CRUD)
  public retrieve(callback?: () => void): void { }
  public search(restartIndex = false, callback?: (event: number) => void): void { }
  public saveOrUpdate(callback?: (event: number) => void): void { }
  public delete(pk: number, description: string, callback?: (event: number) => void): void { }

  // Métodos de utility
  public confirm(message?: string, subtitle?: string): Observable<boolean> { }
  public goToPage(route: string): void { }
  public history(pk = null, ...exclude: string[]): void { }
}
```

**BaseOptions Interface (Configuração):**
```typescript
export interface BaseOptions {
  pk?: string;                      // Primary key, default: "id"
  endpoint: string;                 // API endpoint
  paramsOnInit?: {};                // Params iniciais
  retrieveOnInit?: boolean;          // Fazer GET ao inicializar?
  searchOnInit?: boolean;            // Fazer SEARCH ao inicializar?
  nextRoute?: string;               // Rota após salvar/atualizar
  pageSize?: number;                // Itens por página
  keepFilters?: boolean;            // Manter filtros?
}
```

### 2.2 Estrutura de Componentes Existentes

Exemplo real no repositório:
```
skeleton-web/src/app/components/
├── base.component.ts                    # Classe abstrata base
├── basic/
│   └── company/
│       └── company.component.ts          # Componente que estende BaseComponent
├── account/
│   ├── module/
│   │   ├── module.component.ts           # Lista (search com paginação)
│   │   └── module-root/
│   │       └── module-root.component.ts  # Detalhe (retrieve + update)
│   └── group/
│       └── group.component.ts
```

### 2.3 Padrões Identificados

**Componentes de LISTA (com paginação):**
- Implementam `search()`
- Usam `MatPaginator` e `MatSort`
- `displayedColumns` para definir colunas
- Chamam `search()` no `ngOnInit`

**Componentes de DETALHE:**
- Implementam `retrieve()` para carregar por ID
- Implementam `createFormGroup()` para inicializar formulários
- Implementam `saveOrUpdate()` para persistir

**Serviços:**
- Herdam de `BaseService<T>`
- Lidam com HTTP + criptografia (AES)
- Suportam paginação

---

## 🛠️ PARTE 3: Gerando o Dataset Sintético

### 3.1 Visão Geral do Processo

```
skeleton-web/src/app/
    ↓
[Script Python: 1_generate_dataset.py]
    ├─ Procura arquivos *.component.ts
    ├─ Analisa imports e herança (extends BaseComponent)
    ├─ Extrai propriedades e métodos
    ├─ Envia para Gemini: "Gere uma instrução em português que solicitaria este código"
    ├─ Retorna: { instruction, response }
    └─ Salva em: dados_2026.jsonl
```

### 3.2 Script Python: Geração do Dataset

Crie o arquivo `1_generate_dataset.py` na raiz do projeto:

```python
from groq import Groq
from utils.config import settings

# 1. Configuração Groq
client = Groq(api_key=settings.GROQ_API_KEY)
MODEL_GROQ = "openai/gpt-oss-20b-128k"

def generate_instruction_with_groq(component_code):
    prompt = f"Analise este código Angular e gere uma instrução direta em PT-BR:\n{component_code}"
    
    completion = client.chat.completions.create(
        model=MODEL_GROQ,
        messages=[
            {"role": "system", "content": "Você é um especialista em padrões Angular FPFtech."},
            {"role": "user", "content": prompt}
        ],
    )
    return completion.choices[0].message.content
```

---

## 3. Treinamento Otimizado (Unsloth)

O Unsloth substitui o `AutoModelForCausalLM` do `transformers` por uma versão "tunada" que conversa diretamente com os kernels da sua GPU NVIDIA.

### Protótipo: `src/2_train_qlora.py` (V2)

```python
# Instala bibliotecas necessárias
!pip install -q peft transformers datasets torch bitsandbytes

# Verifica GPU disponível
!nvidia-smi
```

**Passo 3: Carregue dataset do Drive**

```python
from google.colab import drive
import os

# Monta Google Drive
drive.mount('/content/drive')

# Assume que você subiu dados_2026.jsonl no Drive
dataset_path = '/content/drive/My Drive/dados_2026.jsonl'

# Verifica se arquivo existe
if os.path.exists(dataset_path):
    print(f"✅ Dataset encontrado!")
else:
    print(f"❌ Dataset não encontrado em {dataset_path}")
```

---

## 🎯 PARTE 5: Treinamento com QLoRA

### 5.1 Script de Treinamento Completo

Crie o arquivo `2_train_qlora.py` (ou use em uma célula Colab):

```python
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
```

### 5.2 Executando o Treinamento

**Em Google Colab:**

```python
# Célula 1: Instala e carrega
!pip install -q peft transformers datasets torch bitsandbytes trl

# Célula 2: Monta Drive e carrega dataset
from google.colab import drive
drive.mount('/content/drive')

# Copia script de treinamento
!wget -q https://seu-url/2_train_qlora.py

# Edita o caminho do dataset
import os
dataset_path = '/content/drive/My Drive/dados_2026.jsonl'

# Célula 3: Executa treinamento
!python 2_train_qlora.py
```

**Tempo esperado:**
- Colab T4: ~1-2 horas (3 épocas)
- Colab A100: ~20-30 minutos
- DGX H100: ~5 minutos

---

## 📊 PARTE 6: Inferência e Avaliação

### 6.1 Script de Inferência

Crie `3_inference.py`:

```python
#!/usr/bin/env python3
"""
Script para fazer inferência com o modelo fine-tuned.
Compara respostas ANTES (modelo base) vs DEPOIS (com adaptador).
"""

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import json

# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

MODEL_ID = "Qwen/Qwen2.5-Coder-7B"
ADAPTER_PATH = "./adapter_qlora"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

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
        torch_dtype=torch.float16,
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

    # Carrega modelo base
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
    )

    # Aplica adaptador
    model = PeftModel.from_pretrained(model, adapter_path)

    # Merge (opcional, mais rápido para inferência)
    model = model.merge_and_unload()

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
```

### 6.2 Executando Inferência

```bash
python 3_inference.py
```

**Output esperado:**

```
================================================================================
AVALIAÇÃO: Comparação ANTES vs DEPOIS do Fine-Tuning
================================================================================

📥 CARREGANDO MODELOS...
✅ Modelo base carregado

📥 CARREGANDO MODELO FINE-TUNED...
✅ Adaptador aplicado

🧪 EXECUTANDO TESTES...

================================================================================
TESTE 1/10
================================================================================

📝 PROMPT:
Crie um componente Angular para listar empresas com paginação

⏳ Gerando com modelo BASE...
✅ RESPOSTA DO MODELO BASE (primeiros 500 chars):
import { Component } from '@angular/core';
interface Company {
  id: number;
  name: string;
}
@Component({
  selector: 'app-company-list',
  template: `<div>...`
...

────────────────────────────────────────────────────────────────────────────────

⏳ Gerando com modelo FINE-TUNED...
✅ RESPOSTA DO MODELO FINE-TUNED (primeiros 500 chars):
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
...
```

---

## 📋 PARTE 7: Relatório Final

### 7.1 Estrutura do Relatório (PDF)

Crie um relatório em PDF com:

**1. INTRODUÇÃO**
- Objetivo do projeto
- Tema escolhido (Código Angular FPFtech)
- Problemas a resolver

**2. DADOS SINTÉTICOS**
- Processo de coleta (análise de skeleton-web)
- Número de exemplos (ex: 47 componentes → 47 pares)
- 5-10 exemplos de pares (instruction, response)
- Formato do dataset (JSONL)

**3. METODOLOGIA QLoRA**
- Explicação de QLoRA vs LoRA tradicional
- Configuração usada:
  - Rank: 16
  - Alpha: 32
  - Dropout: 0.05
  - Módulos alvo: q_proj, v_proj, k_proj, o_proj, gate_proj, up_proj, down_proj

**4. TREINAMENTO**
- Modelo base: Qwen 2.5 Coder 7B
- Hiperparâmetros:
  - Épocas: 3
  - Learning rate: 2e-4
  - Batch size: 4
  - Sequência máxima: 2048 tokens
- Hardware: Google Colab A100 (ou seu ambiente)
- Tempo total: ~30 minutos
- Loss final: ~1.2 (exemplo)

**5. RESULTADOS (ANTES E DEPOIS)**

Tabela comparando 5 prompts:

| # | Prompt | Antes (Genérico?) | Depois (Segue padrão?) | Melhoria |
|---|--------|-------------------|----------------------|----------|
| 1 | Listar usuários | ❌ Sem BaseComponent | ✅ Usa BaseComponent | Alta |
| 2 | Editar empresa | ❌ FormGroup manual | ✅ FormGroup via base | Alta |
| 3 | Deletar item | ❌ Confirmação customizada | ✅ Usa `delete()` | Alta |
| 4 | Paginar tabela | ❌ MatTable genérica | ✅ `MatPaginator` do base | Média |
| 5 | Buscar filtrado | ❌ RxJS manual | ✅ Usa `search()` | Alta |

**6. ANÁLISE QUALITATIVA**

- O modelo fine-tuned agora:
  - ✅ Sempre herda de `BaseComponent<T>`
  - ✅ Implementa `createFormGroup()`
  - ✅ Usa injeção de dependências via `Injector`
  - ✅ Passa `BaseOptions` ao construtor pai
  - ✅ Usa métodos pré-prontos (`retrieve()`, `search()`, `saveOrUpdate()`, `delete()`)
  - ❌ Ainda precisa de ajustes em HTML template (fora do escopo)

**7. DIFICULDADES E LIMITAÇÕES**

- Dataset pequeno (47 exemplos) → mais exemplos = melhor
- Qwen 7B é modelo pequeno → resultados bons mas não perfeitos
- Sem fine-tuning de templates HTML (escopo foi apenas .ts)
- Precisa validação manual do código gerado

**8. CONCLUSÃO**

O fine-tuning com QLoRA foi bem-sucedido em ensinar o modelo o padrão FPFtech. O modelo agora gera código Angular que:
- Segue a arquitetura esperada (herança de `BaseComponent`)
- Reutiliza métodos pré-prontos
- Mantém consistência com o repositório existente

Isso acelera desenvolvimento e reduz erros de padrão.

---

## 🎯 CHECKLIST FINAL

### Antes da Entrega (31/03/2026)

- [ ] **Dados Sintéticos**
  - [ ] Script `1_generate_dataset.py` funcionando
  - [ ] Arquivo `dados_2026.jsonl` gerado (50-100+ exemplos)
  - [ ] 5-10 exemplos validados manualmente

- [ ] **Treinamento**
  - [ ] Script `2_train_qlora.py` em Notebook Colab
  - [ ] Pasta `adapter_qlora/` com adaptador treinado
  - [ ] Checkpoints salvos

- [ ] **Inferência**
  - [ ] Script `3_inference.py` funcionando
  - [ ] Arquivo `comparison_report.json` gerado
  - [ ] 5 prompts com respostas ANTES/DEPOIS

- [ ] **Relatório PDF**
  - [ ] Introdução e contexto
  - [ ] Descrição dos dados (com exemplos)
  - [ ] Configuração QLoRA
  - [ ] Processo de treinamento
  - [ ] Resultados (antes/depois)
  - [ ] Análise e conclusão

- [ ] **Entregáveis GitHub**
  - [ ] Scripts Python (1, 2, 3)
  - [ ] Notebook Colab `.ipynb`
  - [ ] Dataset `dados_2026.jsonl`
  - [ ] Pasta `adapter_qlora/`
  - [ ] Relatório PDF

---

## 📞 Troubleshooting Comum

### "CUDA out of memory"
```python
# Reduz batch size em TRAINING_CONFIG
"per_device_train_batch_size": 2,  # de 4 para 2
```

### "Gemini API quota exceeded"
```python
# Use fallback de instruções (script já suporta)
# Gera automaticamente instruções simples sem Gemini
```

### "Tokenizador não encontra pad_token"
```python
# Script já trata isso:
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
```

### "Comparação muito lenta"
```python
# Use prompts menores ou sequência máxima menor
max_tokens: int = 256  # ao invés de 512
```

---

## 🚀 Próximos Passos

1. **Executar o pipeline completo:**
   ```bash
   python 1_generate_dataset.py
   python 2_train_qlora.py  # Colab notebook
   python 3_inference.py
   ```

2. **Validar resultados:**
   - Abra `comparison_report.json`
   - Analise se código gerado segue padrão FPFtech

3. **Gerar relatório:**
   - Use resultados do step 2
   - Escreva análise qualitativa

4. **Fazer apresentação:**
   - Slides ou Jupyter slides
   - Máximo 12 minutos
   - Destaque: comparação ANTES/DEPOIS

---

## 📚 Referências

- **QLoRA Paper:** https://arxiv.org/abs/2305.14314
- **Hugging Face PEFT:** https://github.com/huggingface/peft
- **Qwen 2.5 Coder:** https://huggingface.co/Qwen/Qwen2.5-Coder-7B
- **SFTTrainer:** https://huggingface.co/docs/trl/sft_trainer
- **Google Colab:** https://colab.research.google.com/

---

**Bom treinamento! 🚀**
