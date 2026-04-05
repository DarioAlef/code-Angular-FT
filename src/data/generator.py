# src/data/generator.py
import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional

from tqdm import tqdm

from src.clients.groq_client import GroqInstructionGenerator
from src.config import settings
from src.utils.paths import ProjectPaths

logger = logging.getLogger(__name__)


class DatasetGenerator:
    """
    Gera dataset a partir de componentes Angular com MÚLTIPLAS VARIAÇÕES.

    CORREÇÃO CRÍTICA: Para cada componente extraído, gera 5 pares (instruction, response).
    Evita underfitting quando o repositório tem poucos componentes.
    """

    COMPONENT_PATTERN = r"export\s+class\s+(\w+)\s+extends\s+BaseComponent"

    def __init__(self, groq_client: GroqInstructionGenerator):
        """
        Inicializa o gerador.

        Args:
            groq_client: Cliente Groq configurado
        """
        self.groq = groq_client

    def find_components(self, root_dir: Path) -> List[Path]:
        """
        Encontra todos .component.ts no diretório.

        Args:
            root_dir: Raiz do projeto

        Returns:
            Lista de caminhos de componentes
        """
        components = list(root_dir.glob("**/*.component.ts"))
        return sorted(components)

    def extract_code(self, file_path: Path) -> Optional[str]:
        """
        Extrai classe que estende BaseComponent.

        Args:
            file_path: Caminho do arquivo .component.ts

        Returns:
            Código da classe ou None
        """
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        match = re.search(
            r"(export\s+class\s+\w+\s+extends\s+BaseComponent.*?(?=\n^(?:export|import|\Z)))",
            content,
            re.MULTILINE | re.DOTALL,
        )
        return match.group(0).strip() if match else None

    def generate_dataset(self, max_samples: Optional[int] = None) -> List[Dict]:
        """
        Gera dataset com MÚLTIPLAS INSTRUÇÕES por componente.

        Se houver 50 componentes e 5 variações cada = 250 pares.
        Isso elimina underfitting e melhora generalização.

        Args:
            max_samples: Número máximo de componentes a processar

        Returns:
            Lista de dicts com instruction e response
        """
        components = self.find_components(ProjectPaths.SYNTHETIC_DIR)

        if max_samples:
            components = components[:max_samples]

        logger.info(f"🔍 Encontrados {len(components)} componentes")
        logger.info(
            f"📊 Esperado: {len(components) * 5} pares de treinamento (5 variações cada)"
        )

        dataset = []
        failed_components = 0

        for component_file in tqdm(
            components, desc="Gerando dataset com 5 variações"
        ):
            code = self.extract_code(component_file)
            if not code:
                logger.warning(f"❌ Não foi possível extrair: {component_file}")
                failed_components += 1
                continue

            # Trunca se muito longo (Groq tem limite de tokens)
            code_truncated = (
                code[:1500] + "..." if len(code) > 1500 else code
            )

            # Gera 5 variações com Groq
            instructions = self.groq.generate(code_truncated)

            if not instructions:
                # Fallback: cria 1 instrução simples, não 5
                logger.warning(
                    f"⚠️  Fallback para {component_file.stem}"
                )
                name = component_file.stem.replace(".component", "")
                instructions = [f"Crie um componente Angular para {name}"]

            # Cria pares (instruction, response) para cada variação
            for instruction in instructions:
                if instruction.strip():  # Garante que instrução não está vazia
                    dataset.append(
                        {
                            "instruction": instruction.strip(),
                            "response": code,
                        }
                    )

        logger.info(f"\n📈 Dataset Final:")
        logger.info(
            f"   Componentes processados: {len(components) - failed_components}"
        )
        logger.info(f"   Componentes com falha: {failed_components}")
        logger.info(f"   Total de pares: {len(dataset)}")

        return dataset

    def save(self, dataset: List[Dict], output_file: Path):
        """
        Salva em JSONL.

        Args:
            dataset: Lista de dicts
            output_file: Caminho do arquivo de saída
        """
        with open(output_file, "w", encoding="utf-8") as f:
            for item in dataset:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")

        logger.info(
            f"✅ Dataset salvo: {output_file} ({len(dataset)} exemplos)"
        )


__all__ = ["DatasetGenerator"]
