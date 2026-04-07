import json
import os
import matplotlib.pyplot as plt


METRICS_FILE = "data/output_qlora_v2/metrics/training_metrics_all_steps.json"
OUTPUT_IMAGE = "data/output_qlora_v2/metrics/training_dashboard.png"

def plot_training_dashboard():
    if not os.path.exists(METRICS_FILE):
        print(f"❌ Arquivo de metrificação não encontrado: {METRICS_FILE}")
        print("Certifique-se de executar o treinamento primeiro.")
        return

    try:
        with open(METRICS_FILE, 'r') as f:
            metrics = json.load(f)
    except Exception as e:
        print(f"❌ Erro ao ler arquivo JSON: {e}")
        return

    if not metrics:
        print("⚠️ O arquivo de métricas está vazio.")
        return

    train_epochs = []
    train_loss = []
    train_lr = []
    train_grad = []
    train_steps = []
    
    eval_epochs = []
    eval_loss = []

    for m in metrics:
        loss_val = m.get("train_loss") or m.get("loss")
        if loss_val is not None:
            train_epochs.append(m.get("epoch", 0))
            train_loss.append(loss_val)
            train_steps.append(m.get("step", 0))
            if "learning_rate" in m:
                train_lr.append(m["learning_rate"])
            if "grad_norm" in m:
                train_grad.append(m["grad_norm"])

        if "eval_loss" in m:
            eval_epochs.append(m.get("epoch", 0))
            eval_loss.append(m["eval_loss"])

    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.suptitle('Dashboard de Fine-Tuning (FPFtech Angular Coder - Qwen 3B)', fontsize=16, fontweight='bold')

    # Gráfico 1: Curva de Aprendizado (Loss)
    axes[0].plot(train_epochs, train_loss, label='Loss (Treino)', color='#1f77b4', alpha=0.8, linewidth=1.5)
    if eval_loss:
        axes[0].scatter(eval_epochs, eval_loss, label='Loss (Validação)', color='#d62728', s=50, zorder=5)
        axes[0].plot(eval_epochs, eval_loss, color='#d62728', linestyle='--', alpha=0.6)
    
    axes[0].set_title('Convergência do Modelo', fontsize=13)
    axes[0].set_xlabel('Época')
    axes[0].set_ylabel('Loss (Erro)')
    axes[0].legend()
    axes[0].grid(True, linestyle='--', alpha=0.7)

    # Gráfico 2: Learning Rate (Decaimento)
    if train_lr:
        axes[1].plot(range(len(train_lr)), train_lr, color='#2ca02c', linewidth=2)
        axes[1].set_title('Taxa de Aprendizado (LR)', fontsize=13)
        axes[1].set_xlabel('Logs de Treino')
        axes[1].set_ylabel('Learning Rate')
        axes[1].ticklabel_format(style='sci', axis='y', scilimits=(0,0))
        axes[1].grid(True, linestyle='--', alpha=0.7)
    else:
        axes[1].text(0.5, 0.5, 'LR não disponível', ha='center', va='center')

    # Gráfico 3: Gradient Norm (Estabilidade)
    if train_grad:
        axes[2].plot(train_epochs[:len(train_grad)], train_grad, color='#9467bd', alpha=0.7)
        axes[2].set_title('Estabilidade (Grad Norm)', fontsize=13)
        axes[2].set_xlabel('Época')
        axes[2].set_ylabel('Norma do Gradiente')
        axes[2].grid(True, linestyle='--', alpha=0.7)
    else:
        axes[2].text(0.5, 0.5, 'Aguardando próximo treino\npara dados de gradiente', ha='center', va='center', color='gray')

    plt.tight_layout()
    plt.subplots_adjust(top=0.85)
    
    os.makedirs(os.path.dirname(OUTPUT_IMAGE), exist_ok=True)
    
    plt.savefig(OUTPUT_IMAGE, dpi=300)
    print(f"✅ Dashboard gerado com sucesso!")
    print(f"📍 Localização: {OUTPUT_IMAGE}")

if __name__ == "__main__":
    plot_training_dashboard()
