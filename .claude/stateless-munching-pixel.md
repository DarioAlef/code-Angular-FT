# Plano Atualizado: Fine-Tuning QLoRA com Unsloth + Groq

## 📋 Context

O plano anterior usava abordagem monolítica com scripts gigantes e dependências misturadas. Agora, com a experiência do treinamento inicial, estamos atualizando para:

- **Unsloth** (FastLanguageModel): 2-3x mais rápido, 70% menos VRAM que transformers
- **Groq Cloud** (GPT-OSS 20B 128k): API rápida e barata para gerar instruções
- **Arquitetura modular**: Código separado em módulos, scripts menores e reutilizáveis
- **✨ NOVO: 5 Variações por Componente**: Evita underfitting multiplicando dataset por 5

**Objetivo:** Refazer o fine-tuning de forma mais eficiente, com geração de dataset automática via Groq, e código bem estruturado.

---

## 🔥 Correção Crítica Implementada

| Problema | Solução | Impacto |
|----------|---------|--------|
| 50 componentes = 50 pares (underfitting) | Groq gera 5 variações por componente | **50 → 250 pares** |
| Instruções genéricas demais | 5 estilos: direto, detalhado, informal, negócio, refatoração | Melhor generalização |
| Dataset homogêneo | Múltiplas perspectivas do mesmo código | Modelo mais robusto |

**Antes:**
```
UserListComponent.ts → "Crie um componente Angular"
CompanyEditComponent.ts → "Crie um componente Angular"
(Monótono e pequeno)
```

**Depois:**
```
UserListComponent.ts →
  1. "Crie um componente Angular que estende BaseComponent..."
  2. "Implemente um componente com paginação, filtros e sorting..."
  3. "Precisa fazer um comp pra listar users?"
  4. "Tela que mostra todos os usuários do sistema..."
  5. "Refatore para usar signals..."
(Variado e 5x maior)
```

---

## 🏗️ Arquitetura Proposta

```
code-Angualr-FT/
├── src/
│   ├── __init__.py
│   ├── config.py              # Variáveis de configuração
│   ├── clients/
│   │   ├── __init__.py
│   │   ├── groq_client.py     # Cliente Groq para geração
│   │   └── huggingface_hub.py # Upload/download de modelos
│   ├── data/
│   │   ├── __init__.py
│   │   ├── loader.py          # Carrega JSONL, processa
│   │   ├── generator.py       # Gera instruções via Groq
│   │   └── validator.py       # Valida quality dos dados
│   ├── models/
│   │   ├── __init__.py
│   │   ├── unsloth_wrapper.py # Wrapper do Unsloth/FastLanguageModel
│   │   └── inference.py       # Carrega adaptador + faz inferência
│   ├── training/
│   │   ├── __init__.py
│   │   ├── trainer.py         # SFTTrainer com Unsloth
│   │   └── utils.py           # Helpers (logging, callbacks)
│   └── utils/
│       ├── __init__.py
│       ├── paths.py           # Gerencia caminhos do projeto
│       └── logging.py         # Setup de logging
├── scripts/
│   ├── 1_generate_dataset.py   # Main: Extrai código + Groq gera instruções
│   └── 2_train_and_infer.py    # Main: Treina + Avalia ANTES/DEPOIS
├── notebooks/
│   └── exploration.ipynb       # Para debug/exploração
├── .env                        # GROQ_API_KEY, HF_TOKEN, etc.
├── pyproject.toml              # Dependências
├── requirements.txt            # ou uv.lock
└── .claude/FINE_TUNING_PLAN.md # Este plano
```

---

## 📦 Dependências Atualizadas

**Em `pyproject.toml`:**

```toml
[project]
name = "fpftech-finetuning"
version = "2.0.0"
description = "QLoRA fine-tuning com Unsloth e Groq"

dependencies = [
    # Unsloth & transformers
    "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git",
    "transformers==4.36.2",
    "torch>=2.1.1",
    "peft==0.7.1",

    # Training
    "trl==0.8.6",
    "datasets==2.16.0",
    "bitsandbytes==0.41.2",

    # Groq API
    "groq==0.4.2",

    # Utilities
    "python-dotenv==1.0.0",
    "pydantic==2.5.0",
    "tqdm==4.66.2",

    # Hugging Face Hub
    "huggingface-hub==0.20.1",
]

[tool.uv]
python-version = "3.11"
```

---

## 🔧 Módulos Detalhados

### 1. `src/config.py` - Configurações Centralizadas

```python
# src/config.py
from pathlib import Path
from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Groq
    groq_api_key: str
    groq_model: str = "openai/gpt-oss-20b-128k"

    # Unsloth
    model_id: str = "unsloth/Qwen2.5-Coder-3B-bnb-4bit"
    max_seq_length: int = 2048

    # Training
    output_dir: Path = Path("./checkpoints")
    adapter_dir: Path = Path("./adapter_qlora")
    num_epochs: int = 3
    batch_size: int = 4
    learning_rate: float = 2e-4

    # Dataset
    dataset_file: Path = Path("./dados_2026.jsonl")
    train_split: float = 0.9

    # Paths
    skeleton_web_dir: Path = Path("./skeleton-web/src/app")

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

### 2. `src/clients/groq_client.py` - API Groq com 5 Variações

```python
# src/clients/groq_client.py
from groq import Groq
from typing import Optional, List
import json
import logging

logger = logging.getLogger(__name__)

class GroqInstructionGenerator:
    """
    Gera 5 variações de instruções usando Groq GPT-OSS 20B 128k.

    CORREÇÃO CRÍTICA: Evita underfitting gerando múltiplas instruções por componente.
    Se tiver 50 componentes, gera 50 * 5 = 250 pares (evita dataset pequeno).
    """

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.client = Groq(api_key=api_key)
        self.model = model
        self.system_prompt = """Você é um expert em Angular e padrões FPFtech.
Analise o código TypeScript fornecido e gere um array JSON com 5 instruções diferentes em PT-BR
que um desenvolvedor poderia usar para pedir a criação deste código.

Variações obrigatórias:
1. Direto e técnico (mencionando BaseComponent, tipos, métodos específicos)
2. Detalhado (descrevendo a responsabilidade e comportamento esperado)
3. Informal e prático (como um dev pediria no Slack)
4. Focado em regra de negócio (qual problema/feature resolve)
5. Refatoração (melhorando ou adaptando um código existente)

Retorne APENAS um array JSON válido com 5 strings, sem markdown, sem explicações extras.
Exemplo: ["instrução 1", "instrução 2", "instrução 3", "instrução 4", "instrução 5"]"""

    def generate(self, component_code: str, max_tokens: int = 500) -> Optional[List[str]]:
        """
        Gera 5 variações de instruções para um componente.

        Returns: List[str] com 5 instruções, ou None se falhar
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Código:\n```typescript\n{component_code}\n```"}
                ],
                max_tokens=max_tokens,
                temperature=0.7,  # Mais variação nas respostas
            )

            response_text = response.choices[0].message.content.strip()

            # Parse JSON
            instructions = json.loads(response_text)

            # Valida se temos 5 strings
            if isinstance(instructions, list) and len(instructions) == 5:
                return instructions
            else:
                logger.warning(f"Esperado 5 instruções, obtive {len(instructions)}")
                return instructions[:5] if len(instructions) >= 5 else None

        except json.JSONDecodeError as e:
            logger.error(f"Erro ao fazer parse JSON: {e}")
            logger.error(f"Response: {response_text[:200]}")
            return None
        except Exception as e:
            logger.error(f"Erro ao chamar Groq: {e}")
            return None
```

**Nota importante sobre o modelo:**
- `"openai/gpt-oss-20b-128k"` → use se estiver dentro da lista de modelos disponíveis
- `"llama-3.3-70b-versatile"` → alternativa mais rápida e barata (recomendada para geração de variações)
- Verifique disponibilidade em https://console.groq.com/docs/models

### 3. `src/data/generator.py` - Geração de Dataset com Múltiplas Variações

```python
# src/data/generator.py
import json
import re
from pathlib import Path
from typing import Optional, List, Dict
from tqdm import tqdm
import logging

from src.clients.groq_client import GroqInstructionGenerator
from src.config import settings

logger = logging.getLogger(__name__)

class DatasetGenerator:
    """
    Gera dataset a partir de componentes Angular com MÚLTIPLAS VARIAÇÕES.

    CORREÇÃO CRÍTICA: Para cada componente extraído, gera 5 pares (instruction, response).
    Evita underfitting quando o repositório tem poucos componentes.
    """

    COMPONENT_PATTERN = r'export\s+class\s+(\w+)\s+extends\s+BaseComponent'

    def __init__(self, groq_client: GroqInstructionGenerator):
        self.groq = groq_client

    def find_components(self, root_dir: Path) -> List[Path]:
        """Encontra todos .component.ts no diretório"""
        return sorted(root_dir.glob("**/*.component.ts"))

    def extract_code(self, file_path: Path) -> Optional[str]:
        """Extrai classe que estende BaseComponent"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        match = re.search(
            r'(export\s+class\s+\w+\s+extends\s+BaseComponent.*?(?=\n^(?:export|import|\Z)))',
            content,
            re.MULTILINE | re.DOTALL
        )
        return match.group(0).strip() if match else None

    def generate_dataset(self, max_samples: Optional[int] = None) -> List[Dict]:
        """
        Gera dataset com MÚLTIPLAS INSTRUÇÕES por componente.

        Se houver 50 componentes e 5 variações cada = 250 pares.
        Isso elimina underfitting e melhora generalização.
        """
        components = self.find_components(settings.skeleton_web_dir)

        if max_samples:
            components = components[:max_samples]

        logger.info(f"🔍 Encontrados {len(components)} componentes")
        logger.info(f"📊 Esperado: {len(components) * 5} pares de treinamento (5 variações cada)")

        dataset = []
        failed_components = 0

        for component_file in tqdm(components, desc="Gerando dataset com 5 variações"):
            code = self.extract_code(component_file)
            if not code:
                logger.warning(f"❌ Não foi possível extrair: {component_file}")
                failed_components += 1
                continue

            # Trunca se muito longo (Groq tem limite de tokens)
            code_truncated = code[:1500] + "..." if len(code) > 1500 else code

            # Gera 5 variações com Groq
            instructions = self.groq.generate(code_truncated)

            if not instructions:
                # Fallback: cria 1 instrução simples, não 5
                logger.warning(f"⚠️  Fallback para {component_file.stem}")
                name = component_file.stem.replace(".component", "")
                instructions = [f"Crie um componente Angular para {name}"]

            # Cria pares (instruction, response) para cada variação
            for instruction in instructions:
                if instruction.strip():  # Garante que instrução não está vazia
                    dataset.append({
                        "instruction": instruction.strip(),
                        "response": code,
                    })

        logger.info(f"\n📈 Dataset Final:")
        logger.info(f"   Componentes processados: {len(components) - failed_components}")
        logger.info(f"   Componentes com falha: {failed_components}")
        logger.info(f"   Total de pares: {len(dataset)}")

        return dataset

    def save(self, dataset: List[Dict], output_file: Path):
        """Salva em JSONL"""
        with open(output_file, 'w', encoding='utf-8') as f:
            for item in dataset:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")

        logger.info(f"✅ Dataset salvo: {output_file} ({len(dataset)} exemplos)")
```

**Exemplo de Expansão:**
```
Antes (1 variação por componente):
- UserListComponent → 1 pair
- CompanyEditComponent → 1 pair
Total: 50 pares

Depois (5 variações por componente):
- UserListComponent → 5 pairs (direto, detalhado, informal, negócio, refatoração)
- CompanyEditComponent → 5 pairs
Total: 250 pares ✅
```

### 4. `src/models/unsloth_wrapper.py` - Wrapper Unsloth

```python
# src/models/unsloth_wrapper.py
from unsloth import FastLanguageModel
from peft import get_peft_model, LoraConfig
from transformers import AutoTokenizer
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

class UnslothModel:
    """Wrapper para FastLanguageModel do Unsloth"""

    def __init__(
        self,
        model_id: str,
        max_seq_length: int = 2048,
        dtype: str = "float16",
        load_in_4bit: bool = True
    ):
        self.model_id = model_id
        self.max_seq_length = max_seq_length
        self.dtype = dtype
        self.load_in_4bit = load_in_4bit

    def load_model(self) -> Tuple:
        """
        Carrega modelo com FastLanguageModel (2-3x mais rápido)

        Retorna: (model, tokenizer)
        """
        logger.info(f"📥 Carregando {self.model_id} com Unsloth...")

        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=self.model_id,
            max_seq_length=self.max_seq_length,
            dtype=self.dtype,
            load_in_4bit=self.load_in_4bit,
        )

        logger.info(f"✅ Modelo carregado")
        return model, tokenizer

    def setup_lora(self, model, rank: int = 16):
        """Configura LoRA para QLoRA fine-tuning"""
        logger.info("🔧 Configurando LoRA...")

        model = FastLanguageModel.get_peft_model(
            model,
            r=rank,
            lora_alpha=32,
            lora_dropout=0.05,
            bias="none",
            use_gradient_checkpointing="unsloth",
            random_state=42,
            target_modules=[
                "q_proj", "v_proj", "k_proj", "o_proj",
                "gate_proj", "up_proj", "down_proj"
            ]
        )

        model.print_trainable_parameters()
        return model
```

### 5. `src/data/loader.py` - Carregador de Dataset

```python
# src/data/loader.py
import json
from pathlib import Path
from typing import Dict, Tuple
from datasets import Dataset
import logging

logger = logging.getLogger(__name__)

class DatasetLoader:
    """Carrega e processa dataset JSONL"""

    @staticmethod
    def load_jsonl(file_path: Path) -> list[Dict]:
        """Carrega JSONL"""
        data = []
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    data.append(json.loads(line))
        logger.info(f"✅ {len(data)} exemplos carregados de {file_path}")
        return data

    @staticmethod
    def to_huggingface_dataset(data: list[Dict], split_ratio: float = 0.9) -> Dict:
        """Converte para HF Dataset com train/test split"""
        dataset = Dataset.from_dict({
            "instruction": [item["instruction"] for item in data],
            "response": [item["response"] for item in data],
        })

        split = dataset.train_test_split(
            train_size=int(len(dataset) * split_ratio),
            seed=42
        )

        logger.info(f"📊 Train: {len(split['train'])}, Test: {len(split['test'])}")
        return split

    @staticmethod
    def format_prompts(examples: Dict) -> Dict:
        """Formata no padrão Qwen chat"""
        prompts = []
        for instruction, response in zip(examples["instruction"], examples["response"]):
            prompt = f"""<|im_start|>user
{instruction}<|im_end|>
<|im_start|>assistant
{response}<|im_end|>"""
            prompts.append(prompt)
        return {"text": prompts}
```

### 6. `src/training/trainer.py` - Treinamento

```python
# src/training/trainer.py
from trl import SFTTrainer
from transformers import TrainingArguments
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class QLoRATrainer:
    """Treina adaptador LoRA com Unsloth (muito mais rápido)"""

    def __init__(
        self,
        output_dir: str = "./checkpoints",
        num_epochs: int = 3,
        batch_size: int = 4,
        learning_rate: float = 2e-4,
    ):
        self.output_dir = output_dir
        self.num_epochs = num_epochs
        self.batch_size = batch_size
        self.learning_rate = learning_rate

    def train(self, model, tokenizer, dataset) -> 'SFTTrainer':
        """Executa treinamento com Unsloth"""

        logger.info("🚀 Iniciando treinamento com Unsloth...")

        training_args = TrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=self.num_epochs,
            per_device_train_batch_size=self.batch_size,
            per_device_eval_batch_size=self.batch_size,
            gradient_accumulation_steps=4,
            learning_rate=self.learning_rate,
            lr_scheduler_type="cosine",
            warmup_steps=100,
            logging_steps=10,
            save_steps=50,
            save_total_limit=3,
            optim="adamw_8bit",
            seed=42,
            fp16=False,
            bf16=True,
            weight_decay=0.01,
            max_grad_norm=1.0,
        )

        # Formata dataset
        dataset_formatted = dataset.map(
            lambda x: {"text": self._format_prompt(x)},
            batched=True,
            remove_columns=dataset["train"].column_names,
        )

        trainer = SFTTrainer(
            model=model,
            tokenizer=tokenizer,
            args=training_args,
            train_dataset=dataset_formatted["train"],
            eval_dataset=dataset_formatted["test"],
            dataset_text_field="text",
            max_seq_length=2048,
            packing=True,
        )

        trainer.train()
        logger.info("✅ Treinamento concluído")
        return trainer

    @staticmethod
    def _format_prompt(example: dict) -> str:
        """Formata prompt no padrão Qwen"""
        return f"""<|im_start|>user
{example['instruction']}<|im_end|>
<|im_start|>assistant
{example['response']}<|im_end|>"""
```

---

## 📝 Scripts Principais

### Script 1: `scripts/1_generate_dataset.py`

```python
#!/usr/bin/env python3
"""
Gera dataset extraindo componentes Angular + instruções via Groq.

Uso:
    python scripts/1_generate_dataset.py --max-samples 10
    python scripts/1_generate_dataset.py  # Todos os componentes
"""

import logging
from pathlib import Path
from dotenv import load_dotenv

from src.config import settings
from src.clients.groq_client import GroqInstructionGenerator
from src.data.generator import DatasetGenerator

# Setup
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main(max_samples: int = None):
    logger.info("="*80)
    logger.info("GERAÇÃO DE DATASET COM GROQ + UNSLOTH")
    logger.info("="*80)

    # Inicializa Groq
    groq = GroqInstructionGenerator(
        api_key=settings.groq_api_key,
        model=settings.groq_model
    )

    # Gera dataset
    generator = DatasetGenerator(groq)
    dataset = generator.generate_dataset(max_samples=max_samples)

    if not dataset:
        logger.error("Nenhum componente gerado!")
        return

    # Salva
    generator.save(dataset, settings.dataset_file)

    # Preview
    logger.info("\n" + "="*80)
    logger.info(f"PREVIEW: Primeiros 3 exemplos")
    logger.info("="*80)
    for idx, item in enumerate(dataset[:3], 1):
        logger.info(f"\nEXEMPLO {idx}:")
        logger.info(f"  📝 Instrução: {item['instruction'][:80]}...")
        logger.info(f"  💻 Resposta: {item['response'][:100]}...")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-samples", type=int, default=None)
    args = parser.parse_args()

    main(max_samples=args.max_samples)
```

### Script 2: `scripts/2_train_and_infer.py`

```python
#!/usr/bin/env python3
"""
Treina modelo com Unsloth + Avalia ANTES/DEPOIS.

Uso:
    python scripts/2_train_and_infer.py --train
    python scripts/2_train_and_infer.py --infer
    python scripts/2_train_and_infer.py --both
"""

import logging
import json
from pathlib import Path
from dotenv import load_dotenv
import torch

from src.config import settings
from src.data.loader import DatasetLoader
from src.models.unsloth_wrapper import UnslothModel
from src.training.trainer import QLoRATrainer

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TEST_PROMPTS = [
    "Crie um componente Angular para listar empresas com paginação",
    "Faça um componente que estende BaseComponent para gerenciar usuários",
    "Implemente busca com filtros em um componente Angular",
    "Crie um formulário reativo que herda de BaseComponent",
    "Faça um componente para deletar itens com confirmação",
]

def train():
    """Treina o modelo com Unsloth"""
    logger.info("🚀 TREINAMENTO COM UNSLOTH")
    logger.info(f"GPU: {torch.cuda.get_device_name()}")

    # Carrega modelo
    unsloth = UnslothModel(
        model_id=settings.model_id,
        max_seq_length=settings.max_seq_length
    )
    model, tokenizer = unsloth.load_model()
    model = unsloth.setup_lora(model)

    # Carrega dataset
    data = DatasetLoader.load_jsonl(settings.dataset_file)
    dataset = DatasetLoader.to_huggingface_dataset(data)

    # Treina
    trainer_obj = QLoRATrainer(
        output_dir=str(settings.output_dir),
        num_epochs=settings.num_epochs,
        batch_size=settings.batch_size,
        learning_rate=settings.learning_rate,
    )
    trainer = trainer_obj.train(model, tokenizer, dataset)

    # Salva adaptador
    logger.info(f"💾 Salvando adaptador em {settings.adapter_dir}...")
    model.save_pretrained(settings.adapter_dir)
    logger.info("✅ Adaptador salvo")

def infer():
    """Executa inferência ANTES/DEPOIS"""
    logger.info("📊 INFERÊNCIA: ANTES vs DEPOIS")
    # ... (implementação similar ao script anterior)

def main(action: str = "both"):
    if action in ["train", "both"]:
        train()

    if action in ["infer", "both"]:
        infer()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", choices=["train", "infer", "both"], default="both")
    args = parser.parse_args()

    main(action=args.action)
```

---

## ⚠️ CORREÇÃO CRÍTICA: Evitando Underfitting com Múltiplas Variações

### O Problema

O plano anterior tinha um **flaw metodológico grave**:
- 50 componentes Angular = 50 pares (instruction, response)
- Um dataset com 50 exemplos é **muito pequeno** para fine-tuning
- Resultado: **underfitting** (modelo não generaliza, só memoriza)

### A Solução: 5 Variações por Componente

Ao invés de 1 instrução por componente, **Groq gera 5 variações automáticas**:

```
UserListComponent.ts (1 código)
  ├─ Instrução 1: "Crie um componente Angular que estende BaseComponent para listar usuários"
  ├─ Instrução 2: "Implemente um componente com paginação, búsca e integração com API REST"
  ├─ Instrução 3: "Bora fazer um comp pra listar users com sort e filtro?"
  ├─ Instrução 4: "Precisamos de uma tela que mostre todos os usuários do sistema com opção de editar/deletar"
  └─ Instrução 5: "Refatore este componente para usar signals ao invés de RxJS"
```

**Resultado:**
- 50 componentes × 5 variações = **250 pares** ✅
- 100 componentes × 5 variações = **500 pares** ✅
- 200 componentes × 5 variações = **1000 pares** ✅

### Ganhos de Qualidade

| Aspecto | Sem Variações | Com 5 Variações |
|---------|--------------|-----------------|
| Dataset (50 comps) | 50 pares | 250 pares |
| Risco de overfitting | Alto | Baixo |
| Generalização do modelo | Ruim | Excelente |
| Espaço de variação | Limitado | Amplo |
| Tempo total Groq | ~5 min | ~25 min |
| Custo Groq | $0.50 | $2.50 |

### Como o Groq Gera as 5 Variações

```json
{
  "instruction": "Código TypeScript que estende BaseComponent",
  "response": "export class UserListComponent extends BaseComponent<User> { ... }"
}

// Groq retorna:
[
  "Crie um componente Angular que estende BaseComponent para gerenciar a listagem de usuários com paginação",
  "Implemente um componente TypeScript com MatPaginator, MatSort e integração com BaseService para carregar usuários via API",
  "Preciso de um comp em Angular que lista users com filtro, ordenação e paginação - usa BaseComponent mesmo padrão do projeto",
  "Desenvolva uma página que exibe todos os usuários da empresa em uma tabela com opções para editar, deletar e exportar",
  "Refatore o componente de listagem para usar signals (Angular 17+) ao invés de observables RxJS manual"
]
```

### Configuração Necessária

O `src/clients/groq_client.py` já foi atualizado para:
1. Solicitar **5 variações** no `system_prompt`
2. **Parser JSON** para extrair as 5 strings
3. **Fallback** se Groq falhar (retorna 1 instrução simples)

O `src/data/generator.py` já foi atualizado para:
1. Iterar sobre cada variação
2. Criar um pair (instruction, response) para cada uma
3. Log mostrando o multiplicador de pares

---

## 🎯 Fluxo de Execução

### Passo 1: Gerar Dataset com Groq (5 Variações)
```bash
# Teste rápido (10 componentes = 50 pares)
python scripts/1_generate_dataset.py --max-samples 10

# Todos os componentes (50 comps = 250 pares, 100 comps = 500 pares, etc)
python scripts/1_generate_dataset.py
```

**O que acontece:**
1. Script encontra todos `.component.ts` em `skeleton-web/src/app/`
2. Extrai código da classe que estende `BaseComponent`
3. Envia para Groq e solicita **5 variações** de instruções
4. Groq retorna array JSON com 5 instruções diferentes
5. Cria 5 pares (instruction, response) para cada componente
6. Salva em `dados_2026.jsonl`

**Vantagens dessa abordagem:**
- ✅ **5x mais dados** (50 comps → 250 pares)
- ✅ Evita underfitting (modelo generaliza melhor)
- ✅ Variações naturais de como devs pedem código
- ✅ Custa pouco extra (~$2-3 para 100 componentes)
- ✅ Groq é rápido (~500 tokens/seg)

**Estimativa de Tempo:**
- 10 componentes: ~2 min (50 pares)
- 50 componentes: ~10 min (250 pares)
- 100 componentes: ~20 min (500 pares)
- 200 componentes: ~40 min (1000 pares)

### Passo 2: Treinar com Unsloth
```bash
python scripts/2_train_and_infer.py --action train
```

**O que acontece:**
1. Carrega modelo via `FastLanguageModel` (Unsloth)
2. Aplica LoRA com `FastLanguageModel.get_peft_model()`
3. Carrega dataset JSONL
4. Treina com SFTTrainer (50% mais rápido que antes)
5. Salva adaptador em `adapter_qlora/`

**Vantagens Unsloth:**
- ✅ 2-3x mais rápido que transformers
- ✅ 70% menos VRAM (só precisa 4GB)
- ✅ Mesma qualidade de treinamento
- ✅ Compatível com PEFT + TRL

### Passo 3: Avaliar (ANTES vs DEPOIS)
```bash
python scripts/2_train_and_infer.py --action infer
```

**Saída:** `comparison_report.json`

---

## 🧪 Teste Rápido: Validar Geração de Variações

Antes de gerar todo o dataset, teste com 1 componente para validar:

```python
# test_groq_variations.py
from src.config import settings
from src.clients.groq_client import GroqInstructionGenerator
from src.data.generator import DatasetGenerator
from pathlib import Path

# Inicializa
groq = GroqInstructionGenerator(api_key=settings.groq_api_key)
generator = DatasetGenerator(groq)

# Encontra primeiro componente
comps = generator.find_components(settings.skeleton_web_dir)
first_comp = comps[0]

print(f"📄 Testando: {first_comp}")

# Extrai código
code = generator.extract_code(first_comp)
print(f"✅ Código extraído ({len(code)} chars)")

# Gera 5 variações
instructions = groq.generate(code[:1500])

if instructions:
    print(f"\n✨ 5 Variações de Instruções:\n")
    for i, instr in enumerate(instructions, 1):
        print(f"{i}. {instr}\n")
else:
    print("❌ Erro ao gerar variações")
```

**Saída esperada:**
```
📄 Testando: skeleton-web/src/app/components/base.component.ts
✅ Código extraído (4200 chars)

✨ 5 Variações de Instruções:

1. Crie uma classe abstrata BaseComponent que sirva como base para todos os componentes Angular...

2. Implemente um componente base genérico em TypeScript que injete dependências de serviços...

3. Precisamos de um base component que herda de um angular component e fornece métodos pré-prontos...

4. Desenvolva uma classe fundação que padronize como criamos componentes CRUD no projeto...

5. Refatore o componente para usar signals em vez de RxJS observables manual...
```

---

## 📦 Instalação

### Opção 1: Google Colab (Recomendado)

```python
!pip install unsloth[colab-new] transformers==4.36.2 datasets bitsandbytes groq
!git clone https://github.com/seu-user/code-Angualr-FT
%cd code-Angualr-FT

# Configure .env
from google.colab import drive
drive.mount('/content/drive')
# Copie .env para /content/

# Execute
!python scripts/1_generate_dataset.py
!python scripts/2_train_and_infer.py --action both
```

### Opção 2: Localmente (com uv)

```bash
# Clone do repo
git clone https://github.com/seu-user/code-Angualr-FT
cd code-Angualr-FT

# Configure .env com chaves
echo "GROQ_API_KEY=your-key" > .env
echo "HF_TOKEN=your-token" >> .env

# Instale com uv
uv pip install -e .

# Execute scripts
python scripts/1_generate_dataset.py
python scripts/2_train_and_infer.py
```

---

## 🔑 Configuração de Credenciais

**Arquivo `.env`:**
```env
# Groq API (obtenha em https://console.groq.com)
GROQ_API_KEY=gsk_...

# Modelo Groq (verificar disponibilidade em https://console.groq.com/docs/models)
# Opções: "llama-3.3-70b-versatile", "openai/gpt-oss-20b-128k", "openai/gpt-oss-120b"
GROQ_MODEL=llama-3.3-70b-versatile

# Hugging Face (opcional, para upload de modelos)
HF_TOKEN=hf_...

# Wandb (opcional, para tracking de treinamento)
WANDB_API_KEY=...
```

---

## 🐛 Troubleshooting: Problemas Comuns

### Groq retorna erro ao gerar variações

**Erro:** `json.JSONDecodeError` ou Groq não retorna array válido

**Solução:**
1. Aumentar `max_tokens` no `groq_client.py`:
   ```python
   def generate(self, component_code: str, max_tokens: int = 800):  # aumentar de 500
   ```

2. Mudar temperatura (menos criatividade):
   ```python
   temperature=0.5,  # ao invés de 0.7
   ```

3. Simplificar o `system_prompt` se Groq tiver dificuldade:
   ```python
   self.system_prompt = """Retorne um array JSON com 5 instruções em PT-BR.
   Formato: ["instr1", "instr2", "instr3", "instr4", "instr5"]"""
   ```

### Dataset gerado tem muitos duplicados

**Causa:** Groq pode gerar instruções semelhantes em diferentes variações

**Solução:** Adicionar deduplicação em `generator.py`:
```python
# Antes de adicionar ao dataset
if instruction.strip() not in [d["instruction"] for d in dataset]:
    dataset.append({...})
```

### Groq API rate limit atingido

**Erro:** `RateLimitError` depois de muitos componentes

**Solução:**
1. Usar `--max-samples 10` para testar primeiro
2. Adicionar delay entre requisições:
   ```python
   import time
   time.sleep(1)  # 1 segundo entre chamadas
   ```
3. Usar modelo mais rápido:
   ```python
   model="llama-3.3-70b-versatile"  # mais rápido que gpt-oss
   ```

---

## 🧪 Verificação Final

Após treinamento, verificar:

1. **Adaptador gerado:**
   ```bash
   ls -la adapter_qlora/
   # adapter_model.bin (≈200MB)
   # adapter_config.json
   ```

2. **Dataset:**
   ```bash
   wc -l dados_2026.jsonl  # Número de exemplos
   head -1 dados_2026.jsonl  # Primeiro exemplo
   ```

3. **Relatório de comparação:**
   ```bash
   python -c "import json; r=json.load(open('comparison_report.json')); print(f'{len(r)} testes executados')"
   ```

---

## 🚀 Benefícios da Nova Arquitetura

| Aspecto | Antes (Plan v1) | Depois (Plan v2) |
|---------|-----------------|-----------------|
| **Scripts** | 1 gigante (700+ linhas) | 2 scripts modulares |
| **Dataset** | 50 pares (1 por componente) | 250+ pares (5 variações) |
| **Tempo treino** | ~1-2h (Colab T4) | ~20-30min (Unsloth) |
| **VRAM** | 12GB (quantizado) | 4GB (Unsloth 4-bit) |
| **Geração de instruções** | Gemini (cota) | Groq ($0.10/1M) |
| **Risco de underfitting** | Alto | Muito Baixo |
| **Tempo geração dataset** | ~5 min (1 por comp) | ~20 min (5 por comp) |
| **Reutilização código** | Difícil | Fácil (módulos) |
| **Testabilidade** | Baixa | Alta (funções puras) |

**Resumo da Melhoria:**
- ❌ Antes: Dataset pequeno → underfitting → modelo não generaliza
- ✅ Depois: Dataset grande (5 variações) → generalização → modelo reutilizável

---

## 📚 Referências

- **Unsloth**: [https://github.com/unslothai/unsloth](https://github.com/unslothai/unsloth)
- **FastLanguageModel**: [Documentação](https://unsloth.ai/docs/models/)
- **Groq Cloud**: [https://console.groq.com/docs/models](https://console.groq.com/docs/models)
- **GPT-OSS 20B**: [HF Hub](https://huggingface.co/openai/gpt-oss-20b)
