#!/usr/bin/env python3
"""
Analisa e visualiza métricas de treino salvas durante o fine-tuning.

Uso:
    python scripts/analyze_training_metrics.py
    python scripts/analyze_training_metrics.py data/output_qlora_v2/metrics
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd
import logging

logger = logging.getLogger(__name__)


def load_metrics(metrics_dir: Path):
    """Carrega arquivos de métricas"""

    epochs_file = metrics_dir / "training_metrics_by_epoch.json"
    if epochs_file.exists():
        with open(epochs_file) as f:
            epochs_data = json.load(f)
        print(f"✅ Métricas de {len(epochs_data)} épocas carregadas")
    else:
        print(f"❌ Arquivo não encontrado: {epochs_file}")
        return None

    # CSV para análise
    epochs_csv = metrics_dir / "training_metrics_by_epoch.csv"
    if epochs_csv.exists():
        df_epochs = pd.read_csv(epochs_csv)
    else:
        df_epochs = None

    # Resumo
    summary_file = metrics_dir / "training_summary.json"
    if summary_file.exists():
        with open(summary_file) as f:
            summary = json.load(f)
    else:
        summary = None

    return {
        "epochs_dict": epochs_data,
        "epochs_df": df_epochs,
        "summary": summary,
        "epochs_file": epochs_file,
        "epochs_csv": epochs_csv,
        "metrics_dir": metrics_dir,
    }


def print_summary(data):
    """Imprime resumo do treino"""
    summary = data["summary"]
    if not summary:
        print("⚠️  Sem resumo disponível")
        return

    print("\n" + "="*80)
    print("📊 RESUMO DO TREINAMENTO")
    print("="*80)

    print(f"\n📈 Épocas: {summary.get('total_epochs', 'N/A')}")
    print(f"   Steps totais: {summary.get('total_steps', 'N/A')}")

    train_loss = summary.get("train_loss", {})
    print(f"\n🔴 Loss de Treino:")
    if train_loss.get('initial') is not None:
        print(f"   Inicial: {train_loss.get('initial'):.4f}")
        print(f"   Final: {train_loss.get('final'):.4f}")
        print(f"   Mínimo: {train_loss.get('min'):.4f}")
        print(f"   Máximo: {train_loss.get('max'):.4f}")

        if train_loss.get('initial') and train_loss.get('final'):
            reduction = (1 - train_loss['final'] / train_loss['initial']) * 100
            print(f"   ✅ Redução: {reduction:.1f}%")
    else:
        print("   N/A")

    eval_loss = summary.get("eval_loss", {})
    if eval_loss.get('initial') is not None:
        print(f"\n🟡 Loss de Validação:")
        print(f"   Inicial: {eval_loss.get('initial'):.4f}")
        print(f"   Final: {eval_loss.get('final'):.4f}")
        print(f"   Mínimo: {eval_loss.get('min'):.4f}")

        if eval_loss.get('initial') and eval_loss.get('final'):
            reduction = (1 - eval_loss['final'] / eval_loss['initial']) * 100
            print(f"   ✅ Redução: {reduction:.1f}%")

    lr = summary.get("learning_rate", {})
    if lr.get('initial') is not None:
        print(f"\n📍 Learning Rate:")
        print(f"   Inicial: {lr.get('initial')}")
        print(f"   Final: {lr.get('final')}")

    print("\n" + "="*80)


def print_epochs_table(data):
    """Imprime tabela com dados por época"""
    df = data["epochs_df"]
    if df is None or len(df) == 0:
        print("\n⚠️  Dados de épocas não disponíveis")
        return

    print("\n" + "="*80)
    print("📋 MÉTRICAS POR ÉPOCA")
    print("="*80 + "\n")

    pd.set_option('display.max_columns', None)
    pd.set_option('display.width', None)
    pd.set_option('display.max_rows', None)

    def format_value(x):
        if pd.isna(x):
            return "N/A"
        elif isinstance(x, float):
            if x < 0.1 or x > 1000:
                return f"{x:.2e}"
            else:
                return f"{x:.6f}"
        return str(x)

    df_display = df.copy()
    for col in df_display.columns:
        df_display[col] = df_display[col].apply(format_value)

    print(df_display.to_string(index=False))
    print("\n" + "="*80)

    csv_path = data["epochs_csv"]
    print(f"\n💾 Dados completos em: {csv_path}")


def plot_metrics(data):
    """Cria gráficos das métricas (se matplotlib disponível)"""
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        print("\n⚠️  matplotlib não instalado. Pule a visualização de gráficos")
        print("   Para instalar: pip install matplotlib")
        return

    df = data["epochs_df"]
    if df is None or len(df) == 0:
        print("\n⚠️  Dados insuficientes para gerar gráficos")
        return

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle("📊 Métricas de Treinamento", fontsize=16, fontweight='bold')

    # Plot 1: Train Loss
    if "train_loss" in df.columns:
        ax = axes[0, 0]
        ax.plot(df["epoch"], df["train_loss"], marker='o', color='red', linewidth=2, label='Train Loss')
        if "eval_loss" in df.columns and df["eval_loss"].notna().any():
            ax.plot(df["epoch"], df["eval_loss"], marker='s', color='orange', linewidth=2, label='Eval Loss')
        ax.set_xlabel("Época", fontsize=11)
        ax.set_ylabel("Loss", fontsize=11)
        ax.set_title("Loss por Época", fontsize=12, fontweight='bold')
        ax.legend()
        ax.grid(True, alpha=0.3)

    # Plot 2: Learning Rate
    if "learning_rate" in df.columns and df["learning_rate"].notna().any():
        ax = axes[0, 1]
        ax.plot(df["epoch"], df["learning_rate"], marker='o', color='blue', linewidth=2)
        ax.set_xlabel("Época", fontsize=11)
        ax.set_ylabel("Learning Rate", fontsize=11)
        ax.set_title("Learning Rate por Época", fontsize=12, fontweight='bold')
        ax.grid(True, alpha=0.3)

    # Plot 3: Loss redução percentual
    if "train_loss" in df.columns:
        ax = axes[1, 0]
        initial_loss = df["train_loss"].iloc[0]
        reduction_pct = ((initial_loss - df["train_loss"]) / initial_loss * 100)
        ax.bar(df["epoch"], reduction_pct, color='green', alpha=0.7)
        ax.set_xlabel("Época", fontsize=11)
        ax.set_ylabel("Redução (%)", fontsize=11)
        ax.set_title("Redução de Loss vs Época 1", fontsize=12, fontweight='bold')
        ax.grid(True, alpha=0.3, axis='y')

    # Plot 4: Resumo estatístico
    ax = axes[1, 1]
    ax.axis('off')

    summary = data["summary"]
    if summary and "train_loss" in summary:
        train_loss_data = summary["train_loss"]
        if train_loss_data.get('initial'):
            reduction = (1 - train_loss_data['final'] / train_loss_data['initial']) * 100
            summary_text = f"""
📊 RESUMO ESTATÍSTICO

Épocas: {len(df)}
Loss Inicial: {train_loss_data['initial']:.4f}
Loss Final: {train_loss_data['final']:.4f}
Loss Mínimo: {train_loss_data['min']:.4f}
Redução Total: {reduction:.1f}%
            """
            ax.text(0.1, 0.5, summary_text, fontsize=11, family='monospace',
                    verticalalignment='center')

    plt.tight_layout()

    output_file = data["metrics_dir"] / "training_metrics.png"
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"\n✅ Gráfico salvo em: {output_file}")
    try:
        plt.show()
    except Exception:
        pass


def main():
    if len(sys.argv) < 2:
        metrics_dir = Path("data/output_qlora_v2/metrics")
    else:
        metrics_dir = Path(sys.argv[1])

    if not metrics_dir.exists():
        print(f"❌ Diretório não encontrado: {metrics_dir}")
        print(f"   Use: python scripts/analyze_training_metrics.py <path>")
        print(f"   Padrão: data/output_qlora_v2/metrics")
        sys.exit(1)

    print(f"\n🔍 Analisando métricas de: {metrics_dir}\n")

    data = load_metrics(metrics_dir)
    if data is None:
        sys.exit(1)

    print_summary(data)
    print_epochs_table(data)

    # Tenta plotar
    try:
        plot_metrics(data)
    except Exception as e:
        print(f"\n⚠️  Não foi possível gerar gráficos: {e}")
        print("   (Instale matplotlib: pip install matplotlib)")


if __name__ == "__main__":
    main()
