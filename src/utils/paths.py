# src/utils/paths.py
from pathlib import Path


class ProjectPaths:
    """Gerenciador centralizado de caminhos do projeto"""

    # Root
    ROOT = Path(__file__).parent.parent.parent

    # Source
    SRC = ROOT / "src"
    SCRIPTS = ROOT / "scripts"

    # Data
    DATA = ROOT / "data"
    CHECKPOINTS = DATA / "checkpoints"
    ADAPTER = DATA / "adapter_qlora_v2"
    DATASETS_DIR = DATA / "datasets"

    # Skeleton Web
    SKELETON_WEB = ROOT / "skeleton-web"
    COMPONENTS_DIR = SKELETON_WEB / "src" / "app" / "components"
    SYNTHETIC_DIR = COMPONENTS_DIR / "synthetic"

    # Dataset files
    DATASET_FILE = ROOT / "dados_2026.jsonl"
    COMPARISON_REPORT = ROOT / "comparison_report.json"

    # Notebooks
    NOTEBOOKS = DATA / "notebooks"

    @staticmethod
    def ensure_dirs():
        """Cria diretórios necessários"""
        for path in [
            ProjectPaths.CHECKPOINTS,
            ProjectPaths.ADAPTER,
            ProjectPaths.DATASETS_DIR,
            ProjectPaths.NOTEBOOKS,
        ]:
            path.mkdir(parents=True, exist_ok=True)


# Export
__all__ = ["ProjectPaths"]
