# Projeto GenAI - QLoRA com Dados Sintéticos: Geração de Código Angular Padronizado

## 1. Objetivos do Projeto
* [cite_start]**Geral:** Proporcionar experiência prática no processo de fine-tuning de um modelo de linguagem utilizando QLoRA e dados sintéticos para um domínio de conhecimento específico e atual[cite: 4].
* [cite_start]**Escopo Escolhido:** Geração de código Angular focado em arquitetura B2B escalável (Tendência 2026), treinando o modelo para herdar obrigatoriamente da biblioteca interna `base-components`[cite: 6].

## 2. Estrutura e Metodologia

[cite_start]O projeto está dividido em quatro etapas principais, culminando na apresentação no dia 31/03/2026[cite: 90].

### Etapa 1: Geração de Dados Sintéticos (Scripts Python)
[cite_start]O objetivo é criar um dataset de 500 a 1000 pares de instrução-resposta de alta qualidade[cite: 34].
* **Como funcionará:** Um script Python fará o *parsing* do repositório front-end atual.
* **Ação:** O script identificará todas as classes TypeScript que estendem `base-components` e extrairá o código.
* **Uso de LLM Auxiliar:** O script enviará esse código para a API do Gemini com o prompt: *"Gere a instrução em linguagem natural que solicitaria a criação deste componente exato"*.
* [cite_start]**Saída:** Um arquivo `dados_2026.json` contendo a instrução (o que o dev pede) e a resposta (o código Angular exato padronizado)[cite: 32, 33, 76].

### Etapa 2: Treinamento do Adaptador QLoRA (Ambiente DGX)
[cite_start]Como o projeto exige treinar um adaptador para um modelo menor[cite: 9], utilizaremos o **Qwen 2.5 Coder 7B**.
* [cite_start]**Infraestrutura:** O treinamento ocorrerá no servidor DGX para máxima velocidade, utilizando a biblioteca `peft` e `transformers` do Hugging Face[cite: 41].
* [cite_start]**Configuração:** O script de treinamento (`train.py` ou `.ipynb`) fará o load do modelo em 4-bit (QLoRA) e ajustará hiperparâmetros (rank, alpha, batch size)[cite: 43, 69, 70, 71].
* **O "Pulo do Gato":** Durante as épocas de treinamento, o modelo aprenderá que, sempre que for solicitado um novo componente, a sintaxe correta envolve importar e herdar de `base-components`.

### Etapa 3: Exportação e Inferência Local
[cite_start]Após o loop de treinamento finalizado[cite: 84]:
* [cite_start]Salvaremos o adaptador treinado, que gerará a pasta com `adapter_model.bin` e `adapter_config.json`[cite: 87, 88, 89].
* Baixaremos esses arquivos do DGX para o ambiente local.
* Para os testes, o script de inferência fará o merge do modelo base (Qwen) com o nosso adaptador LoRA recém-treinado.

### Etapa 4: Avaliação "Antes e Depois"
[cite_start]Elaboraremos 10 prompts de teste solicitando a criação de componentes Angular[cite: 46].
* [cite_start]**Teste "Antes":** Submeter os 10 prompts ao Qwen 2.5 Coder 7B original (sem adaptador) e registrar as respostas[cite: 49]. O esperado é um código Angular genérico.
* [cite_start]**Teste "Depois":** Submeter os mesmos prompts ao modelo com o adaptador QLoRA aplicado[cite: 52, 53]. O esperado é o código aderente à arquitetura interna.
* [cite_start]**Análise:** Comparação destacando como o modelo fine-tuned aprendeu a seguir o padrão `base-components`[cite: 54, 58].

## 3. Checklist de Entregáveis
Para a entrega final, os seguintes itens devem ser garantidos:
1. [cite_start]**Relatório Escrito (PDF):** Contendo a descrição dos dados sintéticos, configuração QLoRA, processo de treinamento, resultados "antes e depois" de 5 prompts e a conclusão[cite: 60, 66, 69, 72, 73, 75].
2. [cite_start]**Dataset:** Arquivo `dados_2026.json` com todos os pares instrução-resposta[cite: 76].
3. [cite_start]**Código-Fonte:** Notebook (.ipynb) ou scripts Python (.py) comentados com todo o pipeline (geração, treinamento e inferência)[cite: 77, 78, 86].
4. [cite_start]**Adaptador:** Arquivos do adaptador LoRA treinado[cite: 87].
