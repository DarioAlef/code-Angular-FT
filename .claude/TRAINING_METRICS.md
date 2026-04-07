# 📊 Guia: Análise de Métricas de Treinamento

## Visão Geral

Durante o fine-tuning com QLoRA, o sistema salva automaticamente **todas as métricas de treinamento** em arquivos estruturados para análise posterior.

## Arquivos Gerados

Após cada treinamento, os seguintes arquivos são criados em `data/output_qlora_v2/metrics/`:

```
metrics/
├── training_metrics_by_epoch.json       # Métricas resumidas por época (JSON)
├── training_metrics_by_epoch.csv        # Idem em CSV (abrir no Excel)
├── training_metrics_all_steps.json      # Cada step registrado (JSON)
├── training_metrics_all_steps.csv       # Idem em CSV
├── training_summary.json                # Resumo estatístico
└── training_metrics.png                 # Gráfico visual (se matplotlib instalado)
```

## Como Usar

### 1️⃣ Treinar (métricas salvas automaticamente)

```bash
python scripts/2_train_and_infer.py --action train
```

Durante o treino, você verá logs como:

```
📊 Época 1: train_loss=2.1234, eval_loss=1.9876, lr=5e-05
📊 Época 2: train_loss=1.5432, eval_loss=1.4567, lr=5e-05
📊 Época 3: train_loss=1.2345, eval_loss=1.1890, lr=5e-05
✅ Métricas por época salvas em: data/output_qlora_v2/metrics/training_metrics_by_epoch.json
✅ Métricas de steps (CSV) salvas em: data/output_qlora_v2/metrics/training_metrics_all_steps.csv
✅ Resumo de treino salvo em: data/output_qlora_v2/metrics/training_summary.json
```

### 2️⃣ Analisar Métricas (após treino)

**Opção A: Visualização completa com gráficos**

```bash
python scripts/analyze_training_metrics.py
```

Isso exibe:
- Resumo estatístico no console
- Tabela com métricas por época
- Gráficos (se matplotlib instalado)

**Opção B: Path customizado**

```bash
python scripts/analyze_training_metrics.py data/output_qlora_v2/metrics
```

**Opção C: Análise manual em Python**

```python
import json
import pandas as pd

# Carregar dados por época
with open("data/output_qlora_v2/metrics/training_metrics_by_epoch.json") as f:
    epochs = json.load(f)

# Converter para DataFrame para análise
df = pd.read_csv("data/output_qlora_v2/metrics/training_metrics_by_epoch.csv")

# Ver redução de loss
print(f"Loss inicial: {df['train_loss'].iloc[0]:.4f}")
print(f"Loss final: {df['train_loss'].iloc[-1]:.4f}")
print(f"Redução: {(1 - df['train_loss'].iloc[-1] / df['train_loss'].iloc[0]) * 100:.1f}%")
```

**Opção D: Abrir em Excel**

```bash
# Windows
start data/output_qlora_v2/metrics/training_metrics_by_epoch.csv

# macOS
open data/output_qlora_v2/metrics/training_metrics_by_epoch.csv

# Linux
xdg-open data/output_qlora_v2/metrics/training_metrics_by_epoch.csv
```

## O que é rastreado?

### Por Época
- `epoch`: Número da época (1-3)
- `step`: Step global do treinamento
- `train_loss`: Loss médio de treino
- `eval_loss`: Loss de validação
- `learning_rate`: Taxa de aprendizado

### Por Step
- `step`: Identificador único
- `epoch`: Em qual época ocorreu
- `train_loss`: Loss neste step
- `learning_rate`: LR neste step
- `eval_loss`: (se foi step de avaliação)

### Resumo (`training_summary.json`)
```json
{
  "total_epochs": 3,
  "total_steps": 438,
  "train_loss": {
    "initial": 2.45,
    "final": 1.23,
    "min": 1.18,
    "max": 2.45
  },
  "eval_loss": {
    "initial": 2.40,
    "final": 1.20,
    "min": 1.15,
    "max": 2.40
  },
  "learning_rate": {
    "initial": 5e-05,
    "final": 5e-05
  }
}
```

## Interpretando os Resultados

### ✅ Bom Treinamento
```
Época 1: loss=2.50
Época 2: loss=1.75 (↓ 30%)
Época 3: loss=1.20 (↓ 52%)
```
→ Loss diminui consistentemente = modelo aprendendo

### ⚠️ Possível Overfitting
```
Época 1: train_loss=2.50, eval_loss=2.45
Época 2: train_loss=1.20, eval_loss=2.10 (divergência!)
Época 3: train_loss=0.50, eval_loss=2.50 (muito divergente)
```
→ Train loss cai muito mas eval loss sobe = memorização

### ❌ Treino Não Converge
```
Época 1: loss=2.50
Época 2: loss=2.48 (nenhuma melhora)
Época 3: loss=2.49 (pior)
```
→ Loss não muda = learning rate muito baixo ou dados ruins

## Gráficos Gerados

Se matplotlib estiver instalado, `training_metrics.png` mostra:

1. **Loss por Época** (esquerda superior)
   - Linha vermelha = train loss
   - Linha laranja = eval loss
   - Espera-se ambas caindo

2. **Learning Rate** (direita superior)
   - Mostra a taxa de aprendizado ao longo das épocas

3. **Redução de Loss** (esquerda inferior)
   - Gráfico de barras mostrando % de redução por época
   - Espera-se barras crescentes

4. **Resumo** (direita inferior)
   - Estatísticas resumidas em texto

## Instalando matplotlib (opcional)

Para gerar gráficos bonitos:

```bash
pip install matplotlib
```

## Troubleshooting

### ❌ "Arquivo não encontrado"
```
❌ Arquivo não encontrado: data/output_qlora_v2/metrics/training_metrics_by_epoch.json
```

**Solução**: Certifique-se que o treino foi executado completamente:
```bash
python scripts/2_train_and_infer.py --action train
```

### ❌ "matplotlib não instalado"
```
⚠️ matplotlib não instalado. Pule a visualização de gráficos
```

**Solução** (opcional - análise em tabela ainda funciona):
```bash
pip install matplotlib
```

### ❌ Sem dados de validação
Se `eval_loss` está vazio, é porque a avaliação está desabilitada na config (normal).

## Exemplo Completo

```bash
# 1. Treinar (15-20 minutos dependendo do hardware)
python scripts/2_train_and_infer.py --action train

# 2. Analisar resultados
python scripts/analyze_training_metrics.py

# 3. Output esperado:
# ================================================================================
# 📊 RESUMO DO TREINAMENTO
# ================================================================================
#
# 📈 Épocas: 3
#    Steps totais: 438
#
# 🔴 Loss de Treino:
#    Inicial: 2.4532
#    Final: 1.1234
#    Mínimo: 1.0987
#    Máximo: 2.4532
#    ✅ Redução: 54.1%
```

## Dúvidas Frequentes

**P: Posso interromper o treino e depois analisar as métricas?**
R: Sim! Se o treino for interrompido normalmente, os dados salvos até então estarão em `training_summary.json`.

**P: Como comparar múltiplos treinamentos?**
R: Salve cada treinamento em pasta separada e compare os JSONs:
```bash
cp -r data/output_qlora_v2/metrics data/metrics_treino_v1
# ... modificar config ...
python scripts/2_train_and_infer.py --action train
# Agora compare metrics_treino_v1/training_summary.json vs output_qlora_v2/metrics/training_summary.json
```

**P: O loss está muito alto. Por quê?**
R: Possíveis causas:
- Learning rate muito alta → diminua para 1e-5
- Dataset muito pequeno → aumente para 2.000+ exemplos
- Modelo mal quantizado → use full precision (fp16)
- Dados com problemas → valide com `scripts/check_setup.py`

---

**📌 Resumo**: Treine, analise, aprenda! 🚀
