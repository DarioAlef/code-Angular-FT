# src/data/generator.py
import json
import logging
import re
from pathlib import Path
from typing import Optional

from tqdm import tqdm

from src.clients.groq_client import GroqInstructionGenerator
from src.config import settings

logger = logging.getLogger(__name__)


class DatasetGenerator:
    """Extrai componentes Angular e gera 5 instruções por componente com Groq"""

    def __init__(self, groq_client: GroqInstructionGenerator):
        self.groq = groq_client

    def find_components(self) -> list:
        """Encontra todos os .component.ts no skeleton-web"""
        components_dir = settings.skeleton_web_dir
        if not components_dir.exists():
            logger.error(f"❌ Diretório não encontrado: {components_dir}")
            return []

        files = list(components_dir.glob("**/*.component.ts"))
        logger.info(f"🔍 Encontrados {len(files)} componentes")
        return sorted(files)

    def extract_full_component(self, file_path: Path) -> Optional[str]:
        """Extrai arquivo .ts COMPLETO com imports, decorator e implementação"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Valida se tem BaseComponent
            if "extends BaseComponent" not in content:
                return None

            return content.strip()
        except Exception as e:
            logger.error(f"Erro ao extrair {file_path}: {e}")
            return None

    def generate_dataset(self, max_samples: Optional[int] = None) -> list:
        """
        Gera dataset com 5 instruções por componente.
        50 componentes × 5 = 250 pares
        """
        components = self.find_components()

        if max_samples:
            components = components[:max_samples]
            logger.info(f"⚙️  Limitando a {max_samples} componentes (teste)")

        logger.info(f"📊 Esperado: {len(components) * 5} pares de treinamento")

        dataset = []
        failed = 0

        for comp_file in tqdm(components, desc="Gerando com Groq"):
            code = self.extract_full_component(comp_file)

            if not code:
                failed += 1
                continue

            # Groq gera 5 instruções para esse componente completo
            instructions = self.groq.generate(code)

            if not instructions:
                # Fallback
                name = comp_file.stem.replace(".component", "")
                instructions = [f"Crie um componente Angular completo para {name}"]

            # Cria 5 pares (instruction, response) por componente
            # response = arquivo .ts COMPLETO (imports, decorator, métodos)
            for instruction in instructions:
                if instruction.strip():
                    dataset.append({
                        "instruction": instruction.strip(),
                        "response": code
                    })

        logger.info(f"\n✅ Processados: {len(components) - failed} componentes")
        logger.info(f"⚠️  Falhados: {failed}")
        logger.info(f"📈 Total pares: {len(dataset)}")

        return dataset

    def save(self, dataset: list, output_file: Optional[Path] = None):
        """Salva em JSONL (uma linha por par)"""
        output = output_file or settings.dataset_file

        with open(output, "w", encoding="utf-8") as f:
            for item in dataset:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")

        logger.info(f"✅ Dataset salvo: {output} ({len(dataset)} exemplos)")


__all__ = ["DatasetGenerator"]
