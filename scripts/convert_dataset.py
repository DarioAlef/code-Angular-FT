#!/usr/bin/env python3
"""
Converte o dataset antigo (instruction/response) para o novo formato conversacional
com system prompt e filtra exemplos que não seguem o padrão BaseComponent.

Uso:
    python scripts/convert_dataset.py
"""
import json
import sys
from src.utils.config import settings
from src.data.loader import is_valid_basecomponent, convert_to_conversation
from src.data.generator import BOUNDARY_EXAMPLES

INPUT_FILE = settings.paths.dataset_file
OUTPUT_FILE = INPUT_FILE.parent / "augmented_dataset_v2.jsonl"


def main():
    print(f"📥 Lendo dataset de: {INPUT_FILE}")

    total = 0
    valid = 0
    filtered = 0

    with open(INPUT_FILE, "r", encoding="utf-8") as fin, \
         open(OUTPUT_FILE, "w", encoding="utf-8") as fout:

        for line in fin:
            if not line.strip():
                continue
            total += 1
            item = json.loads(line)

            # Já está no formato novo
            if "messages" in item:
                fout.write(json.dumps(item, ensure_ascii=False) + "\n")
                valid += 1
                continue

            # Formato antigo: filtra e converte
            if not is_valid_basecomponent(item.get("response", "")):
                filtered += 1
                continue

            conv = convert_to_conversation(item, settings.system_prompt)
            fout.write(json.dumps(conv, ensure_ascii=False) + "\n")
            valid += 1

        # Adiciona exemplos de fronteira
        for item in BOUNDARY_EXAMPLES:
            fout.write(json.dumps(item, ensure_ascii=False) + "\n")
            valid += 1

    print(f"\n📊 Resultado:")
    print(f"   Total lidos:    {total}")
    print(f"   Válidos:        {valid - len(BOUNDARY_EXAMPLES)} (código)")
    print(f"   Filtrados:      {filtered} (não estendem BaseComponent)")
    print(f"   Fronteira:      {len(BOUNDARY_EXAMPLES)} (exemplos de recusa)")
    print(f"   Total final:    {valid}")
    print(f"\n✅ Dataset salvo em: {OUTPUT_FILE}")
    print(f"\n💡 Para usar no treino, atualize dataset_file no .env ou renomeie:")
    print(f"   mv {OUTPUT_FILE} {INPUT_FILE}")


if __name__ == "__main__":
    main()
