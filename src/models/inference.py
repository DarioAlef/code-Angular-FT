import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

import torch
from peft import PeftModel
from transformers import AutoTokenizer, AutoModelForCausalLM
from unsloth import FastLanguageModel

from src.utils.config import settings

logger = logging.getLogger(__name__)

QWEN_CHAT_TEMPLATE = (
    "{% for message in messages %}"
    "{{'<|im_start|>' + message['role'] + '\\n' + message['content'] + '<|im_end|>\\n'}}"
    "{% endfor %}"
    "{% if add_generation_prompt %}"
    "{{ '<|im_start|>assistant\\n' }}"
    "{% endif %}"
)


class ModelInference:
    """Carrega modelo + adaptador para inferência"""

    def __init__(
        self,
        model_id: str = settings.model_id,
        adapter_path: Optional[str] = None,
        device: str = "auto",
        load_in_4bit: bool = True,
    ):
        self.model_id = model_id
        self.adapter_path = adapter_path
        self.device = device if device != "auto" else ("cuda" if torch.cuda.is_available() else "cpu")
        self.load_in_4bit = load_in_4bit
        self.model = None
        self.tokenizer = None



    def _get_model_kwargs(self):
        """Retorna kwargs comuns para carregar o modelo"""
        kwargs = {
            "device_map": "auto",
            "trust_remote_code": True,
        }
        if self.load_in_4bit:
            from transformers import BitsAndBytesConfig
            kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
            )
        else:
            kwargs["torch_dtype"] = torch.float16
        return kwargs



    def _setup_tokenizer(self):
        """Configura tokenizer com chat template e pad token"""
        if self.tokenizer.chat_template is None:
            self.tokenizer.chat_template = QWEN_CHAT_TEMPLATE
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token



    def load_base_model(self):
        """Carrega modelo base sem adaptador usando Unsloth para consistência"""
        logger.info(f"📥 Carregando modelo base: {self.model_id}")
        
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name=self.model_id,
            max_seq_length=settings.training.max_seq_length,
            load_in_4bit=self.load_in_4bit,
            trust_remote_code=True,
        )
        
        FastLanguageModel.for_inference(self.model)
        self._setup_tokenizer()
        logger.info("✅ Modelo base carregado (via Unsloth)")



    def load_with_adapter(self):
        """Carrega modelo com adaptador LoRA usando Unsloth"""
        if not self.adapter_path:
            raise ValueError("adapter_path não foi fornecido")

        logger.info(f"📥 Carregando modelo + adaptador: {self.adapter_path}")
        
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name=self.adapter_path,
            max_seq_length=settings.training.max_seq_length,
            load_in_4bit=self.load_in_4bit,
            trust_remote_code=True,
        )

        FastLanguageModel.for_inference(self.model)
        self._setup_tokenizer()
        logger.info("✅ Modelo com adaptador carregado (via Unsloth)")



    def post_process(self, text: str, prompt: Optional[str] = None) -> str:
        """
        Limpa o texto gerado removendo APENAS tokens especiais.
        NÃO remove palavras como 'assistant'/'user'/'system' que podem aparecer em código.
        """
        if not text:
            return ""

        special_tokens = [
            "<|im_start|>", "<|im_end|>",
            "<|endoftext|>", "<|file_separator|>",
            "<|repo_name|>", "<|file_sep|>",
            "<|fim_prefix|>", "<|fim_suffix|>", "<|fim_middle|>",
        ]
        for token in special_tokens:
            text = text.replace(token, "")

        if text.startswith("/src/") or text.startswith("src/"):
            if "\nimport " in text:
                _, text = text.split("\nimport ", 1)
                text = "import " + text
            elif "\n@Component" in text:
                _, text = text.split("\n@Component", 1)
                text = "@Component" + text

        return text.strip()



    def generate_code(
        self,
        prompt: str,
        max_tokens: int = 2048,
        temperature: float = 0.2,
        top_p: float = 0.9,
        repetition_penalty: float = 1.15,
    ) -> str:
        """
        Gera código usando MESMO formato do treino: system + user -> assistant.
        """
        if self.model is None or self.tokenizer is None:
            raise ValueError("Modelo não foi carregado!")

        messages = [
            {"role": "system", "content": settings.system_prompt},
            {"role": "user", "content": prompt},
        ]

        formatted_prompt = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )

        inputs = self.tokenizer(
            formatted_prompt, return_tensors="pt", add_special_tokens=False
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                repetition_penalty=repetition_penalty,
                do_sample=temperature > 0,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        input_length = inputs["input_ids"].shape[1]
        new_tokens = outputs[0][input_length:]
        response = self.tokenizer.decode(new_tokens, skip_special_tokens=True)

        return self.post_process(response, prompt)



    def compare_models(
        self,
        base_model: "ModelInference",
        finetuned_model: "ModelInference",
        prompts: List[str],
    ) -> List[Dict]:
        """Compara saídas do modelo base vs fine-tuned."""
        results = []
        for idx, prompt in enumerate(prompts, 1):
            logger.info(f"\n{'='*80}")
            logger.info(f"TESTE {idx}/{len(prompts)}")
            logger.info(f"{'='*80}")
            logger.info(f"\n📝 PROMPT:\n{prompt}\n")

            logger.info("⏳ Gerando com modelo BASE...")
            base_response = base_model.generate_code(prompt)

            logger.info("⏳ Gerando com modelo FINE-TUNED...")
            ft_response = finetuned_model.generate_code(prompt)

            logger.info(f"\n✅ BASE (primeiros 300 chars):\n{base_response[:300]}")
            logger.info(f"\n{'─'*80}")
            logger.info(f"\n✅ FINE-TUNED (primeiros 300 chars):\n{ft_response[:300]}")

            results.append({
                "prompt": prompt,
                "base_response": base_response,
                "ft_response": ft_response,
            })
        return results

    @staticmethod
    def save_comparison_report(
        results: List[Dict], output_file: Path
    ):
        """Salva relatório de comparação."""
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        logger.info(f"\n✅ Relatório salvo em: {output_file}")


__all__ = ["ModelInference"]
