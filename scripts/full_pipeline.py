#!/usr/bin/env python3
"""
Script orquestrador: executa pipeline completo em sequência.

Fluxo:
1. Gera dataset com Groq (145 componentes × 5 instruções)
2. Treina modelo com Unsloth + QLoRA
3. Executa inferência e comparação ANTES/DEPOIS

Uso:
    python scripts/full_pipeline.py
    python scripts/full_pipeline.py --skip-dataset
    python scripts/full_pipeline.py --skip-train
    python scripts/full_pipeline.py --skip-infer
"""

import argparse
import subprocess
import sys
from pathlib import Path
from datetime import datetime
from src.utils.config import settings

# Cores para output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


class PipelineOrchestrator:
    def __init__(self, skip_dataset=False, skip_train=False, skip_infer=False):
        self.skip_dataset = skip_dataset
        self.skip_train = skip_train
        self.skip_infer = skip_infer
        self.project_root = Path(__file__).resolve().parent.parent
        self.venv_python = self.project_root / ".venv" / "bin" / "python3"

        # Fallback para python3 do sistema
        if not self.venv_python.exists():
            self.venv_python = sys.executable

    def print_header(self, title):
        """Imprime header formatado"""
        print(f"\n{BOLD}{BLUE}{'=' * 80}{RESET}")
        print(f"{BOLD}{BLUE}🚀 {title}{RESET}")
        print(f"{BOLD}{BLUE}{'=' * 80}{RESET}\n")

    def print_section(self, title):
        """Imprime seção"""
        print(f"\n{BOLD}{YELLOW}▶ {title}{RESET}\n")

    def print_success(self, msg):
        """Imprime mensagem de sucesso"""
        print(f"{GREEN}✅ {msg}{RESET}")

    def print_error(self, msg):
        """Imprime mensagem de erro"""
        print(f"{RED}❌ {msg}{RESET}")

    def print_info(self, msg):
        """Imprime informação"""
        print(f"{BLUE}ℹ️  {msg}{RESET}")

    def run_command(self, cmd, description):
        """
        Executa comando e monitora resultado.

        Args:
            cmd: Lista com comando e args
            description: Descrição para logging

        Returns:
            True se sucesso, False se falha
        """
        self.print_section(description)
        self.print_info(f"Comando: {' '.join(cmd)}")

        try:
            result = subprocess.run(
                cmd,
                cwd=str(self.project_root),
                capture_output=False,
                text=True,
                timeout=3600  # 1 hora para o treino
            )

            if result.returncode == 0:
                self.print_success(f"{description} concluído com sucesso")
                return True
            else:
                self.print_error(f"{description} falhou com código {result.returncode}")
                return False

        except subprocess.TimeoutExpired:
            self.print_error(f"{description} expirou (timeout > 1h)")
            return False
        except Exception as e:
            self.print_error(f"{description} falhou: {e}")
            return False

    def validate_dependencies(self):
        """Valida se as dependências estão instaladas"""
        self.print_section("Validando dependências")

        deps = ["groq", "pydantic", "torch", "transformers", "trl"]
        missing = []

        for dep in deps:
            try:
                __import__(dep)
                self.print_success(f"{dep} instalado")
            except ImportError:
                self.print_error(f"{dep} não instalado")
                missing.append(dep)

        if missing:
            self.print_error(f"Dependências faltando: {', '.join(missing)}")
            self.print_info("Execute: pip install -e .")
            return False

        return True

    def check_dataset_exists(self):
        """Verifica se dataset já existe"""
        dataset_file = settings.paths.dataset_file
        if dataset_file.exists():
            size_kb = dataset_file.stat().st_size / 1024
            self.print_info(f"Dataset encontrado em: {dataset_file} ({size_kb:.1f} KB)")
            return True
        return False

    def run_full_pipeline(self):
        """Executa pipeline completo"""
        self.print_header(f"PIPELINE COMPLETO - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # Valida dependências
        if not self.validate_dependencies():
            self.print_error("Instale as dependências e tente novamente")
            return False

        # Step 1: Dataset
        if not self.skip_dataset:
            self.print_section("STEP 1/3: Gerando Dataset")
            cmd = [str(self.venv_python), "scripts/generate_dataset.py"]
            if not self.run_command(cmd, "Geração de Dataset"):
                self.print_error("Pipeline abortado: falha na geração do dataset")
                return False
        else:
            self.print_info("⏭️  Pulando geração de dataset")
            if not self.check_dataset_exists():
                self.print_error("Dataset não encontrado e geração foi pulada")
                return False

        # Step 2: Treinamento
        if not self.skip_train:
            self.print_section("STEP 2/3: Treinamento com Unsloth + QLoRA")
            cmd = [
                str(self.venv_python),
                "scripts/train_and_infer.py",
                "--action",
                "train"
            ]
            if not self.run_command(cmd, "Treinamento"):
                self.print_error("Pipeline abortado: falha no treinamento")
                return False
        else:
            self.print_info("⏭️  Pulando treinamento")

        # Step 3: Inferência
        if not self.skip_infer:
            self.print_section("STEP 3/3: Inferência e Comparação")
            cmd = [
                str(self.venv_python),
                "scripts/train_and_infer.py",
                "--action",
                "infer"
            ]
            if not self.run_command(cmd, "Inferência"):
                self.print_error("Pipeline abortado: falha na inferência")
                return False
        else:
            self.print_info("⏭️  Pulando inferência")

        # Sucesso
        self.print_header("✨ PIPELINE CONCLUÍDO COM SUCESSO!")
        self.print_success("Artefatos gerados:")
        self.print_info(f"• {settings.paths.dataset_file.name} - Dataset de treinamento")
        self.print_info(f"• {settings.paths.adapter_dir.name}/ - Adaptador LoRA fine-tuned")
        self.print_info(f"• {settings.paths.comparison_report.name} - Comparação ANTES/DEPOIS")

        return True


def main():
    parser = argparse.ArgumentParser(
        description="Pipeline completo: dataset → treino → inferência",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  python scripts/full_pipeline.py              # Executa tudo
  python scripts/full_pipeline.py --skip-dataset  # Pula geração de dataset
  python scripts/full_pipeline.py --skip-train    # Pula treinamento
  python scripts/full_pipeline.py --skip-infer    # Pula inferência
        """
    )

    parser.add_argument(
        "--skip-dataset",
        action="store_true",
        help="Pula geração de dataset (usa existente)"
    )
    parser.add_argument(
        "--skip-train",
        action="store_true",
        help="Pula treinamento"
    )
    parser.add_argument(
        "--skip-infer",
        action="store_true",
        help="Pula inferência"
    )

    args = parser.parse_args()

    orchestrator = PipelineOrchestrator(
        skip_dataset=args.skip_dataset,
        skip_train=args.skip_train,
        skip_infer=args.skip_infer
    )

    success = orchestrator.run_full_pipeline()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
