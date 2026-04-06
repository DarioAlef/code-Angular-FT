# src/clients/groq_client.py
import json
import logging
import time
from typing import List, Optional

from groq import Groq

from src.config import settings

logger = logging.getLogger(__name__)


class GroqInstructionGenerator:
    """Gera 5 variações de instruções usando Groq (carrega .env automaticamente)"""

    def __init__(self):
        """Inicializa com valores de settings (.env)"""
        self.client = Groq(api_key=settings.groq_api_key, timeout=settings.groq_timeout)
        self.model = settings.groq_model
        self.max_tokens = settings.groq_max_tokens
        self.temperature = settings.groq_temperature
        self.delay_seconds = settings.groq_delay_seconds

    def generate(self, component_code: str) -> Optional[List[str]]:
        """
        Gera 5 variações de instruções para um componente TypeScript.

        Args:
            component_code: Código .component.ts do skeleton-web

        Returns:
            Lista com 5 instruções em português, ou None se falhar
        """
        try:
            # Trunca código muito longo
            code = component_code[:1200] + "..." if len(component_code) > 1200 else component_code

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é expert Angular. Gere 5 instruções em PT-BR para criar esse componente. Retorne como JSON array."
                    },
                    {
                        "role": "user",
                        "content": f"Componente:\n{code}\n\nRetorne como JSON array com 5 instruções diferentes."
                    }
                ],
                max_completion_tokens=self.max_tokens,
                temperature=self.temperature,
                response_format={"type": "json_object"},
                top_p=0.95,
                stop=None,
            )

            # Extrai resposta
            content = response.choices[0].message.content.strip()
            instructions = json.loads(content)

            # Valida formato
            if isinstance(instructions, list) and len(instructions) >= 5:
                return instructions[:5]
            elif isinstance(instructions, dict) and "instructions" in instructions:
                # Fallback se Groq retorna {"instructions": [...]}
                return instructions["instructions"][:5]
            else:
                logger.warning(f"Formato inesperado: {type(instructions)}")
                return None

        except json.JSONDecodeError:
            logger.error(f"JSON inválido de Groq")
            return None
        except Exception as e:
            logger.error(f"Erro Groq: {e}")
            return None
        finally:
            time.sleep(self.delay_seconds)


__all__ = ["GroqInstructionGenerator"]
