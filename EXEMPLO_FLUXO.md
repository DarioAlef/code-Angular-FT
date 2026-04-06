# 📌 Exemplo Prático: Como o Dataset é Gerado

## 🔄 Fluxo Completo

### 1️⃣ ENTRADA: Arquivo Real do Skeleton-Web

**Arquivo:** `skeleton-web/src/app/components/synthetic/user-list.component.ts`

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

### 2️⃣ GROQ GERA: 5 Variações de Instruções

**Entrada para Groq:**
```
Sistema: "Você é expert em Angular FPFtech.
          Gere 5 instruções variadas em PT-BR para este código..."

Usuário: "Código: [... código TypeScript acima ...]"
```

**Saída do Groq (JSON Array):**
```json
[
  "Crie um componente Angular que estende BaseComponent<User> para listar usuários com paginação e formulário de busca",
  "Implemente um componente TypeScript que carrega usuários via API, com injeção de Injector e formulário reativo",
  "Precisa de um comp que lista users com filtro, paginação e busca em tempo real? Usa BaseComponent!",
  "Desenvolva uma página que exibe todos os usuários cadastrados do sistema com opções de editar e deletar",
  "Refatore o componente para usar signals em vez de RxJS observables manuais, mantendo BaseComponent"
]
```

---

### 3️⃣ DATASET: 5 Pares Criados

**Arquivo:** `dados_2026.jsonl` (uma linha por par)

```json
{"instruction": "Crie um componente Angular que estende BaseComponent<User> para listar usuários com paginação e formulário de busca", "response": "export class UserListComponent extends BaseComponent<User> { ... }"}

{"instruction": "Implemente um componente TypeScript que carrega usuários via API, com injeção de Injector e formulário reativo", "response": "export class UserListComponent extends BaseComponent<User> { ... }"}

{"instruction": "Precisa de um comp que lista users com filtro, paginação e busca em tempo real? Usa BaseComponent!", "response": "export class UserListComponent extends BaseComponent<User> { ... }"}

{"instruction": "Desenvolva uma página que exibe todos os usuários cadastrados do sistema com opções de editar e deletar", "response": "export class UserListComponent extends BaseComponent<User> { ... }"}

{"instruction": "Refatore o componente para usar signals em vez de RxJS observables manuais, mantendo BaseComponent", "response": "export class UserListComponent extends BaseComponent<User> { ... }"}
```

---

### 4️⃣ TREINAMENTO: Qwen Aprende

**Qwen vê 580 pares como acima e aprende:**

```
Se pedem (instrução PT-BR) → gera (código TypeScript com BaseComponent)
```

**Qwen generaliza o PADRÃO:**
- ✅ Sempre usa `import { BaseComponent }`
- ✅ Sempre `extends BaseComponent<T>`
- ✅ Sempre recebe `injector: Injector` no construtor
- ✅ Sempre chama `super(injector, options)`
- ✅ Sempre implementa `createFormGroup()`
- ✅ Sempre usa `this.formBuilder` do BaseComponent

---

### 5️⃣ INFERÊNCIA: Você Pede Novo Componente

**Você pede:**
```
"Crie um componente para gerenciar empresas com CRUD"
```

**Qwen fine-tuned gera:**
```typescript
import { Component, Injector } from '@angular/core';
import { BaseComponent } from '../../base.component';

@Component({
  selector: 'app-company-management',
  templateUrl: './company-management.component.html'
})
export class CompanyManagementComponent extends BaseComponent<Company> {
  constructor(injector: Injector) {
    super(injector, {
      endpoint: 'api/companies/',
      searchOnInit: true
    });
  }

  createFormGroup(): void {
    this.formGroup = this.formBuilder.group({
      name: [''],
      cnpj: [''],
      address: ['']
    });
  }
}
```

✅ **PADRÃO MANTIDO SEM VOCÊ PEDIR!**

---

## 📊 Estatísticas

| Métrica | Valor |
|---------|-------|
| Componentes no skeleton-web | 116 |
| Variações por componente | 5 |
| Pares de treinamento | 580 |
| Tempo geração dataset | ~20 min |
| Tempo treinamento (A100) | ~25 min |
| Tamanho adaptador LoRA | ~200 MB |

---

## 🎯 Por Que Funciona

**Sem Fine-tuning:**
```
Prompt: "Crie um componente Angular"
Qwen: "import { Component } from '@angular/core'; ..."
      (Genérico, sem BaseComponent)
```

**Com Fine-tuning:**
```
Prompt: "Crie um componente Angular"
Qwen: "import { BaseComponent } from '../../base.component'; ..."
      (Padrão FPFtech, aprendido dos 580 pares)
```

O modelo não memoriza código específico, **aprende o PADRÃO arquitetural**.

---

## 🚀 Próximo Passo

```bash
# Configure .env com sua chave Groq
echo "GROQ_API_KEY=gsk_..." >> .env

# Gere o dataset
python scripts/1_generate_dataset.py --max-samples 10  # teste
python scripts/1_generate_dataset.py                   # produção

# Treina
python scripts/2_train_and_infer.py --action train

# Avalia
python scripts/2_train_and_infer.py --action infer
```
