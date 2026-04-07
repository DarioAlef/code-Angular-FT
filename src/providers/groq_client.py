# src/providers/groq_client.py
import json
import logging
import time
from typing import List, Optional
from groq import Groq
from src.utils.config import settings

logger = logging.getLogger(__name__)


class GroqInstructionGenerator:
    """Gera 5 variações de instruções usando Groq (carrega .env automaticamente)"""

    def __init__(self):
        """Inicializa com valores de settings (.env)"""
        self.client = Groq(api_key=settings.groq.api_key, timeout=settings.groq.timeout)
        self.model = settings.groq.model
        self.max_tokens = settings.groq.max_tokens
        self.temperature = settings.groq.temperature
        self.delay_seconds = settings.groq.delay_seconds

    def generate(self, component_code: str) -> Optional[List[str]]:
        """
        Gera 5 variações de INSTRUÇÕES APENAS (sem o código, economizando tokens).
        O código será reutilizado para todas as 5 instruções no dataset.

        Args:
            component_code: Código .component.ts do skeleton-web

        Returns:
            Lista com 5 instruções em português, ou None se falhar
        """
        try:
            # Trunca código muito longo para prompt
            code = component_code[:1200] + "..." if len(component_code) > 1200 else component_code

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """Você é expert Angular. Analise o componente e gere 5 instruções DIFERENTES em PT-BR que um dev daria para criar esse código.

IMPORTANTE: Retorne APENAS um objeto JSON com a chave "instructions" contendo as 5 strings. Não inclua o código.

Formatos dos 5 prompts:
1. Técnico: menciona BaseComponent, Injector, tipos genéricos
2. Descritivo: descreve o comportamento esperado
3. Coloquial: como dev faria no Slack
4. Negócio: qual problema resolve
5. Ação: imperativo direto

Retorne JSON: {"instructions": ["instr1", "instr2", "instr3", "instr4", "instr5"]}"""
                    },
                    {
                        "role": "user",
                        "content": f"Componente:\n```typescript\n{code}\n```\n\nRetorne 5 instruções diferentes em um objeto JSON (chave 'instructions')."
                    }
                ],
                max_completion_tokens=512,  # 5 instruções em JSON, sem código
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
