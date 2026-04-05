# src/clients/groq_client.py
import json
import logging
import time
from typing import List, Optional

from groq import Groq

logger = logging.getLogger(__name__)


class GroqInstructionGenerator:
    """
    Gera 5 variações de instruções usando Groq Cloud API.

    CORREÇÃO CRÍTICA: Evita underfitting gerando múltiplas instruções por componente.
    Se tiver 50 componentes, gera 50 * 5 = 250 pares (evita dataset pequeno).
    """

    def __init__(
        self,
        api_key: str,
        model: str = "llama-3.3-70b-versatile",
        max_tokens: int = 800,
        temperature: float = 0.7,
        timeout: int = 30,
        delay_seconds: float = 0.5,
    ):
        """
        Inicializa o gerador Groq.

        Args:
            api_key: Chave API do Groq
            model: Nome do modelo Groq
            max_tokens: Máximo de tokens na resposta
            temperature: Temperatura para geração
            timeout: Timeout em segundos
            delay_seconds: Delay entre requisições (evita rate limit)
        """
        self.client = Groq(api_key=api_key, timeout=timeout)
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.delay_seconds = delay_seconds

        self.system_prompt = """Você é um expert em Angular e padrões FPFtech.
Analise o código TypeScript fornecido e gere um array JSON com 5 instruções diferentes em PT-BR
que um desenvolvedor poderia usar para pedir a criação deste código.

Variações obrigatórias:
1. Direto e técnico (mencionando BaseComponent, tipos, métodos específicos)
2. Detalhado (descrevendo a responsabilidade e comportamento esperado)
3. Informal e prático (como um dev pediria no Slack)
4. Focado em regra de negócio (qual problema/feature resolve)
5. Refatoração (melhorando ou adaptando um código existente)

Retorne APENAS um array JSON válido com 5 strings, sem markdown, sem explicações extras.
Exemplo: ["instrução 1", "instrução 2", "instrução 3", "instrução 4", "instrução 5"]"""

    def generate(self, component_code: str) -> Optional[List[str]]:
        """
        Gera 5 variações de instruções para um componente.

        Args:
            component_code: Código TypeScript do componente

        Returns:
            List[str] com 5 instruções, ou None se falhar
        """
        try:
            # Trunca se muito longo (limite Groq)
            code_truncated = (
                component_code[:1500] + "..."
                if len(component_code) > 1500
                else component_code
            )

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {
                        "role": "user",
                        "content": f"Código:\n```typescript\n{code_truncated}\n```"
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )

            response_text = response.choices[0].message.content.strip()

            # Parse JSON
            instructions = json.loads(response_text)

            # Valida se temos 5 strings
            if isinstance(instructions, list) and len(instructions) >= 5:
                return instructions[:5]
            else:
                logger.warning(
                    f"Esperado 5+ instruções, obtive {len(instructions)}"
                )
                return instructions if len(instructions) > 0 else None

        except json.JSONDecodeError as e:
            logger.error(f"Erro ao fazer parse JSON: {e}")
            logger.debug(f"Response: {response_text[:200]}")
            return None
        except Exception as e:
            logger.error(f"Erro ao chamar Groq: {e}")
            return None
        finally:
            # Delay para evitar rate limit
            time.sleep(self.delay_seconds)


__all__ = ["GroqInstructionGenerator"]
