# Plano de Melhoria: Fine-Tuning QLoRA - Qwen2.5-Coder-3B para FPFtech Angular

## Contexto

O modelo Qwen2.5-Coder-3B foi fine-tunado com QLoRA + Unsloth para gerar codigo TypeScript Angular seguindo o padrao BaseComponent da FPFtech. O resultado foi insatisfatorio: o modelo gera tokens FIM (`<|fim_prefix|>`, `<|file_sep|>`), nao segue o padrao BaseComponent, alucina dialogos de chat, e ignora a "persona" FPFtech. A analise do `comparison_report.json` confirma que o modelo nao aprendeu o padrao.

---

## Diagnostico: 7 Debitos Tecnicos Criticos

### DT-1: MODELO BASE ERRADO (CAUSA RAIZ PRINCIPAL)
- **Problema**: Usando `unsloth/Qwen2.5-Coder-3B-bnb-4bit` (variante BASE, pre-treinada para FIM/code completion)
- **Evidencia**: O comparison_report mostra tokens FIM na saida: `<|fim_prefix|>`, `<|fim_suffix|>`, `<|fim_middle|>`, `<|file_sep|>`
- **Impacto**: O pre-treino FIM domina o fine-tuning. Os tokens `<|im_start|>` do ChatML nao foram treinados no modelo base
- **Correcao**: Trocar para `unsloth/Qwen2.5-Coder-3B-Instruct-bnb-4bit` (variante Instruct, ja treinada com ChatML)

### DT-2: OVERFITTING MASSIVO (~178 EPOCAS)
- **Problema**: `max_steps=1000` com effective_batch=64 e 358 amostras de treino
- **Calculo**: 358 amostras / 64 batch = 5.6 steps/epoca -> 1000/5.6 = **~178 epocas**
- **Impacto**: Modelo memoriza o dataset em vez de generalizar
- **Correcao**: Usar `max_steps=-1`, `num_epochs=3`, batch efetivo menor

### DT-3: SEM SYSTEM PROMPT NO TREINO
- **Problema**: Template de treino so tem user/assistant, sem role "system"
- **Impacto**: Modelo nao sabe que deve agir como "FPFtech Angular Coder"; escorrega para chat generalista
- **Correcao**: Adicionar system prompt fixo em todos os exemplos de treino

### DT-4: LOSS CALCULADA SOBRE INSTRUCOES (NAO USA train_on_responses_only)
- **Problema**: SFTTrainer computa loss sobre tokens de instrucao + resposta
- **Impacto**: Modelo gasta capacidade aprendendo a prever instrucoes em vez de focar em gerar codigo
- **Correcao**: Usar `train_on_responses_only()` do Unsloth para mascarar tokens system/user

### DT-5: DATASET INSUFICIENTE E POUCO DIVERSO
- **Problema**: 398 exemplos, apenas 3 verbos ("Crie"/"Gere"/"Implemente"), sem exemplos negativos
- **Impacto**: Modelo nao generaliza para instrucoes variadas; 15 exemplos nao estendem BaseComponent (ruido)
- **Correcao**: Limpar dataset, diversificar instrucoes, adicionar exemplos de recusa, expandir para 600-800

### DT-6: TEMPLATE MANUAL (STRING CONCATENATION) EM VEZ DE apply_chat_template
- **Problema**: Treino e inferencia concatenam strings manualmente em vez de usar o tokenizer
- **Impacto**: Possivel desalinhamento de tokens especiais; nao aproveita template nativo do modelo
- **Correcao**: Usar `get_chat_template()` + `tokenizer.apply_chat_template()` do Unsloth

### DT-7: HIPERPARAMETROS DESAJUSTADOS
- **Problema**: lr=2e-4 muito alta, lora_alpha=32 (scaling=2.0) muito agressivo, dropout=0, warmup=100 excessivo
- **Impacto**: Catastrophic forgetting + instabilidade no treino
- **Correcao**: lr=5e-5, lora_alpha=16, dropout=0.05, warmup=10

---

## Plano de Implementacao (Ordem de Dependencia)

### Fase 1: Config e Model Selection
**Arquivo**: `src/utils/config.py`

Mudancas:
```python
# ANTES
model_id: str = "unsloth/Qwen2.5-Coder-3B-bnb-4bit"
max_steps: int = 1000
batch_size: int = 1
learning_rate: float = 2e-4
lora_alpha: int = 32
early_stopping_patience: int = 15

# DEPOIS
model_id: str = "unsloth/Qwen2.5-Coder-3B-Instruct-bnb-4bit"
max_steps: int = -1  # Usar epochs em vez de steps
num_epochs: int = 3
batch_size: int = 2
learning_rate: float = 5e-5
lora_alpha: int = 16
lora_dropout: float = 0.05
early_stopping_patience: int = 3
gradient_accumulation_steps: int = 4  # effective batch = 2*4 = 8

# NOVO: System prompt para treino e inferencia
system_prompt: str = (
    "Voce e o FPFtech Angular Coder. Gere APENAS codigo TypeScript Angular "
    "seguindo o padrao BaseComponent da FPFtech. Todo componente DEVE: "
    "estender BaseComponent<T>, usar Injector no construtor, chamar super(injector, options), "
    "implementar createFormGroup() com UntypedFormBuilder, e usar os servicos "
    "herdados (toast, translate, service, router). Responda SOMENTE com codigo."
)
```

### Fase 2: Dataset Overhaul
**Arquivos**: `src/data/loader.py`, `src/data/generator.py`

#### 2a. Novo formato JSONL (conversacional com system prompt)
```jsonl
{"messages": [{"role": "system", "content": "Voce e o FPFtech Angular Coder..."}, {"role": "user", "content": "Crie um componente para gerenciar usuarios"}, {"role": "assistant", "content": "import { Component, Injector..."}]}
```

#### 2b. Limpeza do dataset
- Remover ~15 exemplos que nao estendem BaseComponent
- Validar que cada resposta contem: `extends BaseComponent`, `createFormGroup`, `Injector`

#### 2c. Diversificacao de instrucoes
Adicionar categorias alem de "Crie/Gere/Implemente":
- **Modificacao**: "Adicione um filtro de busca por data ao componente de vendas"
- **Explicacao**: "Explique como o componente de pedidos usa o BaseComponent"
- **Refatoracao**: "Refatore o componente de clientes para usar paginacao server-side"
- **Debug**: "O componente de estoque nao carrega dados no ngOnInit. Corrija."
- **Parcial**: "Implemente apenas o createFormGroup para um componente de funcionarios"

#### 2d. Exemplos de recusa/fronteira (~10-15 exemplos)
```jsonl
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "Oi, tudo bem?"}, {"role": "assistant", "content": "Sou o FPFtech Angular Coder. Posso gerar componentes Angular seguindo a arquitetura BaseComponent da FPFtech. Qual componente deseja criar?"}]}
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "Escreva um componente React"}, {"role": "assistant", "content": "Eu gero apenas componentes Angular no padrao BaseComponent da FPFtech. Descreva o componente Angular que precisa e eu gero o codigo completo."}]}
```

#### 2e. Meta: 600-800 exemplos de alta qualidade

**Arquivo principal**: `src/data/loader.py`
```python
class DatasetLoader:
    @staticmethod
    def load_conversations(file_path: Path) -> List[Dict]:
        """Carrega JSONL no formato conversacional"""
        data = []
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    item = json.loads(line)
                    # Suporta formato antigo (instruction/response) e novo (messages)
                    if "messages" in item:
                        data.append(item)
                    elif "instruction" in item and "response" in item:
                        data.append(convert_to_conversation(item, system_prompt))
        return data
```

### Fase 3: Training Pipeline
**Arquivos**: `src/models/unsloth_wrapper.py`, `src/training/trainer.py`, `src/training/utils.py`

#### 3a. unsloth_wrapper.py - Chat template nativo
```python
from unsloth.chat_templates import get_chat_template

def load_model(self):
    model, tokenizer = FastLanguageModel.from_pretrained(...)
    # Aplica chat template NATIVO do Qwen 2.5
    tokenizer = get_chat_template(tokenizer, chat_template="qwen-2.5")
    return model, tokenizer

def setup_lora(self, model, rank=16, alpha=16, dropout=0.05):
    model = FastLanguageModel.get_peft_model(
        model,
        r=rank,
        lora_alpha=alpha,       # Era 32, agora = rank
        lora_dropout=dropout,   # Era 0, agora 0.05
        ...
    )
```

#### 3b. trainer.py - apply_chat_template + train_on_responses_only
```python
from unsloth.chat_templates import train_on_responses_only

class QLoRATrainer:
    def train(self, model, tokenizer, dataset):
        # Formata usando apply_chat_template (substitui _format_prompts_batch)
        def formatting_func(examples):
            texts = []
            for msgs in examples["messages"]:
                text = tokenizer.apply_chat_template(
                    msgs, tokenize=False, add_generation_prompt=False
                )
                texts.append(text)
            return {"text": texts}

        dataset_formatted = dataset.map(formatting_func, batched=True, ...)

        trainer = SFTTrainer(
            model=model,
            tokenizer=tokenizer,
            args=training_args,
            train_dataset=dataset_formatted["train"],
            eval_dataset=dataset_formatted["test"],
            dataset_text_field="text",
            max_seq_length=2048,
            packing=False,
        )

        # CRITICO: Mascara loss nos tokens system/user
        trainer = train_on_responses_only(
            trainer,
            instruction_part="<|im_start|>user\n",
            response_part="<|im_start|>assistant\n",
        )

        trainer.train()
```

#### 3c. utils.py - Hiperparametros corrigidos
```python
TrainingArguments(
    num_train_epochs=num_epochs,   # 3 epocas (era 99 com max_steps)
    max_steps=-1,                  # Era 1000 (178 epocas!)
    per_device_train_batch_size=batch_size,  # 2
    gradient_accumulation_steps=4,            # Era 16 (effective batch era 64)
    learning_rate=learning_rate,              # 5e-5 (era 2e-4)
    lr_scheduler_type="cosine",
    warmup_steps=10,                          # Era 100
    eval_strategy="epoch",                    # Era "steps" a cada 50
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    weight_decay=0.05,                        # Era 0.01
    ...
)
```

### Fase 4: Inference Alignment
**Arquivo**: `src/models/inference.py`

```python
def generate_code(self, prompt, ...):
    # Usa MESMO system prompt e template do treino
    messages = [
        {"role": "system", "content": settings.system_prompt},
        {"role": "user", "content": prompt},
    ]
    formatted = self.tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = self.tokenizer(formatted, return_tensors="pt").to(self.device)
    ...

def post_process(self, text):
    # Remover APENAS tokens especiais, NAO palavras como "assistant"/"user"/"system"
    # que podem aparecer em codigo legitimo
    special_tokens = ["<|im_start|>", "<|im_end|>", "<|endoftext|>"]
    for token in special_tokens:
        text = text.replace(token, "")
    return text.strip()
```

### Fase 5: Salvar Tokenizer junto com Adapter
**Arquivo**: `scripts/2_train_and_infer.py`

```python
# Apos treino, salvar tokenizer tambem
model.save_pretrained(str(settings.adapter_dir))
tokenizer.save_pretrained(str(settings.adapter_dir))  # NOVO
```

### Fase 6: Validacao Automatizada (novo arquivo)
**Arquivo**: `src/evaluation/validator.py`

Validador estrutural que verifica codigo gerado:
- **Obrigatorio** (peso 1.0): `extends BaseComponent`, `createFormGroup`, `Injector`, `@Component`, `super(injector`
- **Desejavel** (peso 0.5): `formBuilder.group`, `search()`, `Validators`, `URLS.`
- **Proibido** (falha imediata): `<|fim_prefix|>`, `<|fim_suffix|>`, `<|file_sep|>`
- Threshold de sucesso: 85%+ nos obrigatorios, 0 tokens FIM

---

## Tabela Resumo de Mudancas por Arquivo

| Arquivo | Mudancas |
|---------|----------|
| `src/utils/config.py` | model_id Instruct, system_prompt, hiperparametros |
| `src/data/loader.py` | Formato conversacional, suporte messages[], filtro BaseComponent |
| `src/data/generator.py` | Instrucoes mais diversas, gerar formato conversacional |
| `src/models/unsloth_wrapper.py` | get_chat_template(), lora_alpha/dropout parametrizaveis |
| `src/training/trainer.py` | apply_chat_template, train_on_responses_only, remover _format_prompts_batch |
| `src/training/utils.py` | Todos hiperparametros (lr, steps, warmup, grad_accum, weight_decay) |
| `src/models/inference.py` | apply_chat_template com system prompt, fix post_process |
| `scripts/2_train_and_infer.py` | Salvar tokenizer, passar novos params |
| `src/evaluation/validator.py` | NOVO: validador estrutural automatizado |

---

## Verificacao / Teste

1. **Pre-treino**: Executar `scripts/1_generate_dataset.py` com novo formato e validar JSONL
2. **Validar dataset**: Confirmar que todos os exemplos tem messages[] com system/user/assistant
3. **Treino**: Executar `scripts/2_train_and_infer.py --action train` e verificar:
   - Loss inicial ~2-3, loss final ~0.3-0.8
   - Treino roda por 3 epocas (NAO 178)
   - Nenhum token FIM no log
4. **Inferencia**: Executar `scripts/2_train_and_infer.py --action infer` e verificar:
   - Respostas contem `extends BaseComponent`
   - Respostas contem `createFormGroup()`
   - Respostas contem `Injector` no construtor
   - Zero tokens FIM na saida
   - Modelo recusa perguntas de chat com mensagem de fronteira
5. **Comparacao**: `comparison_report.json` deve mostrar melhoria clara vs modelo base
6. **Validacao automatizada**: Rodar `src/evaluation/validator.py` nos resultados
