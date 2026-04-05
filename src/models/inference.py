# src/models/inference.py
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

from src.config import settings
from src.models.unsloth_wrapper import UnslothModel

logger = logging.getLogger(__name__)


class ModelInference:
    """Carrega modelo + adaptador para inferência"""

    def __init__(
        self,
        model_id: str = settings.model_id,
        adapter_path: Optional[str] = None,
        device: str = "auto",
    ):
        """
        Inicializa o inferenciador.

        Args:
            model_id: ID do modelo base
            adapter_path: Caminho do adaptador LoRA
            device: Dispositivo ('auto', 'cuda', 'cpu')
        """
        self.model_id = model_id
        self.adapter_path = adapter_path
        self.device = device if device != "auto" else ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.tokenizer = None

    def load_base_model(self):
        """Carrega modelo base sem adaptador"""
        logger.info(f"📥 Carregando modelo base: {self.model_id}")

        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
        )

        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_id, trust_remote_code=True
        )

        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        logger.info("✅ Modelo base carregado")

    def load_with_adapter(self):
        """Carrega modelo com adaptador LoRA"""
        if not self.adapter_path:
            raise ValueError("adapter_path não foi fornecido")

        logger.info(f"📥 Carregando modelo base: {self.model_id}")
        logger.info(f"🔧 Aplicando adaptador: {self.adapter_path}")

        # Carrega modelo base
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
        )

        # Aplica adaptador
        self.model = PeftModel.from_pretrained(self.model, self.adapter_path)

        # Merge para inferência mais rápida (opcional)
        try:
            self.model = self.model.merge_and_unload()
            logger.info("✅ Adaptador merged para inferência rápida")
        except Exception as e:
            logger.warning(f"⚠️  Não foi possível fazer merge: {e}")

        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_id, trust_remote_code=True
        )

        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        logger.info("✅ Modelo com adaptador carregado")

    def generate_code(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.1,
        top_p: float = 0.9,
    ) -> str:
        """
        Gera código dado um prompt.

        Args:
            prompt: Instrução em texto
            max_tokens: Máximo de tokens
            temperature: Temperatura (0=determinístico)
            top_p: Top-P sampling

        Returns:
            Código gerado
        """
        if self.model is None or self.tokenizer is None:
            raise ValueError("Modelo não foi carregado!")

        # Formata prompt no padrão Qwen
        formatted_prompt = f"""<|im_start|>user
{prompt}<|im_end|>
<|im_start|>assistant
"""

        # Tokeniza
        inputs = self.tokenizer.encode(
            formatted_prompt, return_tensors="pt"
        ).to(self.device)

        # Gera
        with torch.no_grad():
            outputs = self.model.generate(
                inputs,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=temperature > 0,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        # Decodifica
        response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Remove o prompt do output
        response = response.replace(formatted_prompt, "").strip()

        return response

    def compare_models(
        self,
        base_model: "ModelInference",
        finetuned_model: "ModelInference",
        prompts: List[str],
    ) -> List[Dict]:
        """
        Compara saídas do modelo base vs fine-tuned.

        Args:
            base_model: Inferenciador com modelo base
            finetuned_model: Inferenciador com modelo fine-tuned
            prompts: Lista de prompts de teste

        Returns:
            Lista de resultados comparativos
        """
        results = []

        for idx, prompt in enumerate(prompts, 1):
            logger.info(f"\n{'='*80}")
            logger.info(f"TESTE {idx}/{len(prompts)}")
            logger.info(f"{'='*80}")
            logger.info(f"\n📝 PROMPT:\n{prompt}\n")

            # Modelo base
            logger.info("⏳ Gerando com modelo BASE...")
            base_response = base_model.generate_code(prompt)

            # Modelo fine-tuned
            logger.info("⏳ Gerando com modelo FINE-TUNED...")
            ft_response = finetuned_model.generate_code(prompt)

            # Exibe respostas
            logger.info(f"\n✅ RESPOSTA DO MODELO BASE (primeiros 300 chars):")
            logger.info(f"{base_response[:300]}")
            logger.info(f"\n{'─'*80}\n")

            logger.info(
                f"✅ RESPOSTA DO MODELO FINE-TUNED (primeiros 300 chars):"
            )
            logger.info(f"{ft_response[:300]}")

            # Armazena para relatório
            results.append(
                {
                    "prompt": prompt,
                    "base_response": base_response,
                    "ft_response": ft_response,
                }
            )

        return results

    @staticmethod
    def save_comparison_report(
        results: List[Dict], output_file: Path = Path("comparison_report.json")
    ):
        """
        Salva relatório de comparação.

        Args:
            results: Lista de resultados
            output_file: Caminho do arquivo
        """
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        logger.info(f"\n✅ Relatório salvo em: {output_file}")


__all__ = ["ModelInference"]
