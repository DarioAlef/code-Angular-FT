# ⚡ Quick Start: Execute o Pipeline em 5 Passos

## 1️⃣ Obtenha Chave Groq (2 min)

```bash
# Visite: https://console.groq.com
# 1. Crie conta (gratuita com email)
# 2. Gere API key
# 3. Copie a chave

# Cole em .env
echo "GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx" >> .env
```

## 2️⃣ Teste Rápido: Gere Dataset com 10 Componentes (5 min)

```bash
python scripts/1_generate_dataset.py --max-samples 10
```

**O que esperar:**
```
🔍 Encontrados 10 componentes
📊 Esperado: 50 pares de treinamento (5 variações cada)
✅ Dataset salvo: dados_2026.jsonl (50 exemplos)
```

## 3️⃣ Treinar Modelo (20-30 min em GPU)

```bash
python scripts/2_train_and_infer.py --action train
```

**O que esperar:**
```
📥 Carregando unsloth/Qwen2.5-Coder-3B-bnb-4bit com Unsloth...
🔧 Configurando LoRA com Unsloth...
🚀 Iniciando treinamento com Unsloth...
✅ Treinamento concluído
💾 Adaptador salvo em ./adapter_qlora_v2/
```

## 4️⃣ Avaliar Modelo (5 min)

```bash
python scripts/2_train_and_infer.py --action infer
```

**O que esperar:**
```
📊 INFERÊNCIA: ANTES vs DEPOIS
🧪 Executando testes de comparação...

TESTE 1/10
📝 PROMPT: Crie um componente Angular para listar empresas com paginação

✅ RESPOSTA DO MODELO BASE (genérica):
import { Component } from '@angular/core';

✅ RESPOSTA DO MODELO FINE-TUNED (padrão FPFtech):
import { Component, Injector } from '@angular/core';
import { BaseComponent } from '../../base.component';
export class CompanyListComponent extends BaseComponent<Company> {
  ...
}

💾 Relatório salvo em: comparison_report.json
```

## 5️⃣ Produção: Gere com Todos os 116 Componentes (20 min)

```bash
# Depois de validar com --max-samples 10
python scripts/1_generate_dataset.py
```

**Resultado final:**
- 116 componentes × 5 variações = **580 pares**
- Adaptador treinado pronto
- Qwen 3B agora gera código padrão FPFtech

---

## 🎯 Diferença Visual (ANTES vs DEPOIS)

### Antes (Modelo Base)
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-user-list',
  template: `<div>...</div>`
})
export class UserListComponent {
  users = [];
  onSearch(query) {
    // Implementação manual
  }
}
```

### Depois (Fine-Tuned)
```typescript
import { Component, Injector } from '@angular/core';
import { BaseComponent } from '../../base.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html'
})
export class UserListComponent extends BaseComponent<User> {
  constructor(injector: Injector) {
    super(injector, {
      endpoint: 'api/users/',
      searchOnInit: true
    });
  }

  createFormGroup(): void {
    this.formGroup = this.formBuilder.group({
      name: [''],
      email: ['']
    });
  }
}
```

---

## 📊 Progresso Esperado

| Etapa | Tempo | CPU | GPU | Output |
|-------|-------|-----|-----|--------|
| Dataset (10 comps) | 5 min | ✓ | ✓ | 50 pares |
| Treinamento | 20-30 min | ✗ | ✅ | adapter_qlora_v2/ |
| Inferência | 5 min | ✓ | ✓ | comparison_report.json |
| Dataset (116 comps) | 20 min | ✓ | ✓ | 580 pares |

---

## ❓ Troubleshooting Rápido

### "GROQ_API_KEY não configurada!"
```bash
# Solução
echo "GROQ_API_KEY=gsk_..." >> .env
```

### "OOM (Out of Memory)"
```python
# Reduza batch size em src/config.py
batch_size: int = 2  # ao invés de 4
```

### "ModuleNotFoundError: No module named 'unsloth'"
```bash
pip install unsloth[colab-new]
```

---

## 📁 Arquivos Gerados

Após o pipeline completo:
```
├── dados_2026.jsonl              # 50-580 pares de treinamento
├── adapter_qlora_v2/             # Adaptador LoRA treinado
│   ├── adapter_model.safetensors
│   └── adapter_config.json
├── comparison_report.json        # Comparação ANTES/DEPOIS
└── checkpoints/                  # Checkpoints de treinamento (opcional)
```

---

## ✨ Próximo Passo Após Pipeline

1. Analisar `comparison_report.json`
2. Validar qualidade das respostas
3. Criar relatório PDF com resultados
4. Documentar conclusões

---

## 🚀 Ambiente Recomendado

- **Google Colab**: GPU A100 (~30 min treinamento)
- **Sua máquina com GPU**: NVIDIA 24GB+ VRAM
- **Sem GPU**: Use `scripts/1_generate_dataset.py` apenas

---

**Tempo total: ~1 hora (teste rápido com 10 componentes)**

Boa sorte! 🎓
