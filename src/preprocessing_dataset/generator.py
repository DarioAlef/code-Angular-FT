import json
import logging
from pathlib import Path
from typing import Optional, List, Dict

from tqdm import tqdm

from src.providers.groq_client import GroqInstructionGenerator
from src.preprocessing_dataset.loader import is_valid_basecomponent
from src.utils.config import settings

logger = logging.getLogger(__name__)

def load_boundary_examples(path: Path) -> List[Dict]:
    """Carrega exemplos de recusa/fronteira do arquivo JSONL e injeta system prompt."""
    if not path.exists():
        logger.warning(f"⚠️ Arquivo de boundary examples não encontrado: {path}")
        return []
    
    examples = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                item = json.loads(line)
                if "messages" in item:
                    for msg in item["messages"]:
                        if msg["role"] == "system" and msg["content"] == "SYSTEM_PROMPT_PLACEHOLDER":
                            msg["content"] = settings.system_prompt
                examples.append(item)
    except Exception as e:
        logger.error(f"Erro ao carregar boundary examples: {e}")
    
    return examples

BOUNDARY_EXAMPLES_PATH = settings.paths.data / "boundary_examples.jsonl"
BOUNDARY_EXAMPLES = load_boundary_examples(BOUNDARY_EXAMPLES_PATH)


class DatasetGenerator:
    """Extrai componentes Angular e gera 5 instruções por componente com Groq"""

    def __init__(self, groq_client: GroqInstructionGenerator):
        self.groq = groq_client

    def find_components(self) -> list:
        """Encontra todos os .component.ts em /data/datasets"""
        components_dir = settings.paths.components_dir
        if not components_dir.exists():
            logger.error(f"❌ Diretório não encontrado: {components_dir}")
            return []

        files = list(components_dir.glob("*.ts"))
        logger.info(f"🔍 Encontrados {len(files)} componentes em {components_dir}")
        return sorted(files)

    def extract_full_component(self, file_path: Path) -> Optional[str]:
        """Extrai arquivo .ts COMPLETO com imports, decorator e implementação"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            return content.strip() if content.strip() else None
        except Exception as e:
            logger.error(f"Erro ao extrair {file_path}: {e}")
            return None

    def generate_dataset(self, max_samples: Optional[int] = None, output_file: Optional[Path] = None) -> list:
        """
        Gera dataset no formato conversacional com system prompt.
        Salva incrementalmente no arquivo JSONL.
        Filtra exemplos que não seguem o padrão BaseComponent.
        Adiciona exemplos de recusa/fronteira no final.
        """
        components = self.find_components()

        if max_samples:
            components = components[:max_samples]
            logger.info(f"⚙️  Limitando a {max_samples} componentes (teste)")

        logger.info(f"📊 Esperado: ~{len(components) * 5} pares de treinamento")

        output = output_file or settings.paths.dataset_file
        output.parent.mkdir(parents=True, exist_ok=True)

        dataset = []
        failed = 0
        filtered = 0

        with open(output, "w", encoding="utf-8") as f:
            for comp_file in tqdm(components, desc="Gerando com Groq"):
                code = self.extract_full_component(comp_file)

                if not code:
                    failed += 1
                    continue

                if not is_valid_basecomponent(code):
                    filtered += 1
                    logger.debug(f"Filtrado: {comp_file.name} (não estende BaseComponent)")
                    continue

                instructions = self.groq.generate(code)

                if not instructions:
                    name = comp_file.stem.replace(".component", "")
                    instructions = [f"Crie um componente Angular completo para {name}"]

                for instruction in instructions:
                    if instruction.strip():
                        item = {
                            "messages": [
                                {"role": "system", "content": settings.system_prompt},
                                {"role": "user", "content": instruction.strip()},
                                {"role": "assistant", "content": code},
                            ]
                        }
                        dataset.append(item)
                        f.write(json.dumps(item, ensure_ascii=False) + "\n")
                        f.flush()

            logger.info(f"📝 Adicionando {len(BOUNDARY_EXAMPLES)} exemplos de recusa/fronteira...")
            for item in BOUNDARY_EXAMPLES:
                dataset.append(item)
                f.write(json.dumps(item, ensure_ascii=False) + "\n")

        logger.info(f"\n✅ Processados: {len(components) - failed - filtered} componentes")
        logger.info(f"⚠️  Falhados: {failed}")
        logger.info(f"🚫 Filtrados (não BaseComponent): {filtered}")
        logger.info(f"🛡️  Exemplos de fronteira: {len(BOUNDARY_EXAMPLES)}")
        logger.info(f"📈 Total pares: {len(dataset)}")
        logger.info(f"✅ Dataset salvo: {output}")

        return dataset


__all__ = ["DatasetGenerator", "BOUNDARY_EXAMPLES", "load_boundary_examples"]
