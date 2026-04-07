# FPFtech Angular Coder (Fine-Tuning)

Fine-tuning do modelo **Qwen2.5-Coder-3B** para gerar componentes Angular seguindo rigorosamente os padrões arquiteturais da **FPFtech** (`BaseComponent`, `Injector`, etc).

## 🚀 Como Rodar

### 1. Preparação
Certifique-se de que o `.env` possui uma `GROQ_API_KEY` válida.

### 2. Gerar Dataset
Extrai componentes base e gera variações de instruções usando a API do Groq:
```bash
uv run scripts/dataset/generate_dataset.py
```

### 3. Treinar e Testar
Executa o treinamento QLoRA (via Unsloth) otimizado para GPUs de 6GB e gera relatórios de comparação:
```bash
PYTORCH_ALLOC_CONF=expandable_segments:True uv run scripts/train_and_infer.py --action both
```

### 4. Chat com o modelo Fine-tuned
Chat pelo terminal com o modelo fine-tuned:
```bash
uv run scripts/train_and_infer.py --action chat
```


## 📂 Estrutura Principal
- `data/datasets/pre-selected`: Códigos fonte originais do Angular.
- `generated/`: Onde os adaptadores do modelo serão salvos.
- `scripts/`: Scripts utilitários para automação do pipeline.

---
*Fine-tuning pipeline powered by Unsloth* 🚀
