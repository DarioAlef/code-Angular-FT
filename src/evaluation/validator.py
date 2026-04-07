"""
Validador estrutural para código gerado pelo modelo fine-tuned.
Verifica se o código segue o padrão BaseComponent da FPFtech.
"""
import json
import logging
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

from src.utils.config import settings

logger = logging.getLogger(__name__)

REQUIRED_PATTERNS = {
    "extends BaseComponent": r"extends\s+BaseComponent",
    "createFormGroup()": r"createFormGroup\s*\(",
    "Injector": r"Injector",
    "@Component decorator": r"@Component\s*\(",
    "super(injector": r"super\s*\(\s*injector",
}

DESIRED_PATTERNS = {
    "formBuilder.group": r"formBuilder\.group\s*\(",
    "Validators": r"Validators\.",
    "URLS.": r"URLS\.",
    "ngOnInit": r"ngOnInit\s*\(",
    "import BaseComponent": r"import\s*\{[^}]*BaseComponent",
}

FORBIDDEN_TOKENS = [
    "<|fim_prefix|>",
    "<|fim_suffix|>",
    "<|fim_middle|>",
    "<|file_sep|>",
    "<|repo_name|>",
]


@dataclass
class ValidationResult:
    """Resultado da validação de um código gerado"""
    prompt: str
    required_score: float = 0.0
    desired_score: float = 0.0
    has_forbidden_tokens: bool = False
    required_matches: Dict[str, bool] = field(default_factory=dict)
    desired_matches: Dict[str, bool] = field(default_factory=dict)
    forbidden_found: List[str] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return self.required_score >= 0.85 and not self.has_forbidden_tokens

    @property
    def total_score(self) -> float:
        return (self.required_score * 0.7) + (self.desired_score * 0.3)


def validate_code(code: str, prompt: str) -> ValidationResult:
    """Valida um código gerado contra os padrões FPFtech BaseComponent"""
    result = ValidationResult(prompt=prompt)

    for name, pattern in REQUIRED_PATTERNS.items():
        match = bool(re.search(pattern, code))
        result.required_matches[name] = match

    required_total = len(REQUIRED_PATTERNS)
    required_passed = sum(1 for v in result.required_matches.values() if v)
    result.required_score = required_passed / required_total if required_total > 0 else 0

    for name, pattern in DESIRED_PATTERNS.items():
        match = bool(re.search(pattern, code))
        result.desired_matches[name] = match

    desired_total = len(DESIRED_PATTERNS)
    desired_passed = sum(1 for v in result.desired_matches.values() if v)
    result.desired_score = desired_passed / desired_total if desired_total > 0 else 0

    for token in FORBIDDEN_TOKENS:
        if token in code:
            result.forbidden_found.append(token)
    result.has_forbidden_tokens = len(result.forbidden_found) > 0

    return result


def validate_comparison_report(report_path: Path) -> List[ValidationResult]:
    """Valida todos os resultados do comparison_report.json"""
    with open(report_path, "r", encoding="utf-8") as f:
        results = json.load(f)

    validations = []
    for entry in results:
        prompt = entry["prompt"]
        ft_response = entry.get("ft_response", "")
        validation = validate_code(ft_response, prompt)
        validations.append(validation)

    return validations


def print_report(validations: List[ValidationResult]):
    """Imprime relatório de validação formatado"""
    print("\n" + "=" * 80)
    print("📊 RELATÓRIO DE VALIDAÇÃO - FPFtech BaseComponent")
    print("=" * 80)

    total_passed = 0
    total_forbidden = 0

    for i, v in enumerate(validations, 1):
        status = "✅ PASS" if v.passed else "❌ FAIL"
        print(f"\n{'─'*60}")
        print(f"  [{i}] {status} | Score: {v.total_score:.0%} | Prompt: {v.prompt[:60]}...")

        for name, matched in v.required_matches.items():
            icon = "✅" if matched else "❌"
            print(f"      {icon} [REQ] {name}")

        for name, matched in v.desired_matches.items():
            icon = "✅" if matched else "⚠️"
            print(f"      {icon} [DES] {name}")

        if v.forbidden_found:
            for token in v.forbidden_found:
                print(f"      🚫 [PROIBIDO] {token}")
            total_forbidden += 1

        if v.passed:
            total_passed += 1

    total = len(validations)
    pass_rate = total_passed / total if total > 0 else 0
    avg_required = sum(v.required_score for v in validations) / total if total > 0 else 0
    avg_desired = sum(v.desired_score for v in validations) / total if total > 0 else 0
    avg_total = sum(v.total_score for v in validations) / total if total > 0 else 0

    print(f"\n{'='*80}")
    print(f"📈 RESUMO")
    print(f"{'='*80}")
    print(f"  Aprovados:          {total_passed}/{total} ({pass_rate:.0%})")
    print(f"  Score obrigatório:  {avg_required:.0%}")
    print(f"  Score desejável:    {avg_desired:.0%}")
    print(f"  Score total:        {avg_total:.0%}")
    print(f"  Tokens proibidos:   {total_forbidden}/{total} respostas")
    print(f"{'='*80}")

    if pass_rate >= 0.85:
        print("  🎉 RESULTADO: SATISFATÓRIO")
    elif pass_rate >= 0.5:
        print("  ⚠️  RESULTADO: PARCIAL (precisa melhorar)")
    else:
        print("  ❌ RESULTADO: INSATISFATÓRIO")

    return pass_rate


def main():
    report_path = Path(sys.argv[1]) if len(sys.argv) > 1 else settings.paths.comparison_report

    if not report_path.exists():
        print(f"❌ Arquivo não encontrado: {report_path}")
        sys.exit(1)

    validations = validate_comparison_report(report_path)
    pass_rate = print_report(validations)
    sys.exit(0 if pass_rate >= 0.85 else 1)


if __name__ == "__main__":
    main()
