#!/usr/bin/env python3
"""
Script de verificação: valida setup antes de rodar pipeline.
"""

import sys
from pathlib import Path

# Cores
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def check(condition, msg_ok, msg_fail):
    if condition:
        print(f"{GREEN}✅{RESET} {msg_ok}")
        return True
    else:
        print(f"{RED}❌{RESET} {msg_fail}")
        return False


def main():
    print(f"\n{BOLD}{BLUE}{'=' * 80}{RESET}")
    print(f"{BOLD}{BLUE}🔍 VERIFICAÇÃO DE SETUP{RESET}")
    print(f"{BOLD}{BLUE}{'=' * 80}{RESET}\n")

    all_ok = True
    project_root = Path(__file__).resolve().parent.parent

    # 1. Dependências
    print(f"{BOLD}📦 Dependências:{RESET}\n")

    deps = {
        "groq": "Groq API Client",
        "pydantic": "Data Validation",
        "torch": "PyTorch",
        "transformers": "Transformers",
        "trl": "TRL Trainer",
    }

    for dep, name in deps.items():
        try:
            mod = __import__(dep)
            version = getattr(mod, "__version__", "?")
            check(True, f"{name}: {version}", "")
        except ImportError:
            all_ok = False
            check(False, "", f"{name} não instalado")

    try:
        from src.utils.config import settings
    except ImportError:
        print(f"{RED}❌ Erro crítico: Pacote 'src' não encontrado. Execute 'pip install -e .' primeiro.{RESET}")
        sys.exit(1)

    # 2. Arquivos/Diretórios
    print(f"\n{BOLD}📁 Estrutura:{RESET}\n")

    checks = [
        (project_root / "src" / "utils" / "config.py", "src/utils/config.py"),
        (project_root / "src" / "providers" / "groq_client.py", "src/providers/groq_client.py"),
        (project_root / "src" / "data" / "generator.py", "src/data/generator.py"),
        (settings.paths.components_dir, "data/datasets (componentes)"),
        (project_root / ".env", ".env (API keys)"),
    ]

    for path, name in checks:
        if path.exists():
            if path.is_dir():
                num_files = len(list(path.rglob("*.ts"))) if "datasets" in name else "?"
                check(True, f"{name}: {num_files} componentes", "")
            else:
                check(True, f"{name}: OK", "")
        else:
            all_ok = False
            check(False, "", f"{name}: NÃO ENCONTRADO")

    # 3. Configuração
    print(f"\n{BOLD}⚙️  Configuração:{RESET}\n")

    checks_config = [
        (settings.groq.api_key, "GROQ_API_KEY configurada"),
        (settings.paths.components_dir.exists(), f"components_dir: {settings.paths.components_dir}"),
        (settings.paths.dataset_file.exists(), f"dataset_file: {settings.paths.dataset_file}"),
        (settings.groq.max_tokens == 2048, f"groq_max_tokens: {settings.groq.max_tokens}"),
    ]

    for condition, msg in checks_config:
        if condition:
            check(True, msg, "")
        else:
            all_ok = False
            check(False, "", msg)

    # 4. Resumo
    print(f"\n{BOLD}{BLUE}{'=' * 80}{RESET}")
    if all_ok:
        print(f"{GREEN}✅ SETUP OK! Pronto para rodar:{RESET}")
        print(f"   python scripts/full_pipeline.py")
    else:
        print(f"{RED}❌ Alguns problemas encontrados. Veja acima.{RESET}")
    print(f"{BOLD}{BLUE}{'=' * 80}{RESET}\n")

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
