import logging
from src.utils.config import settings

logging.basicConfig(level=logging.INFO)

def export_model():
    print("\n" + "="*50)
    print("📦 FPFtech Angular Coder - Exportação (Merge)")
    print("="*50)

    merged_output_dir = settings.paths.merged_model_dir
    merged_output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"📥 Carregando modelo base e adaptador: {settings.paths.adapter_dir}")
    
    try:
        from unsloth import FastLanguageModel
        
        model, tokenizer = FastLanguageModel.from_pretrained(
            model_name=str(settings.paths.adapter_dir), 
            max_seq_length=settings.training.max_seq_length,
            load_in_4bit=True, # Mantém 4-bit para economizar memória durante o carregamento
        )

        print(f"\n🚀 Iniciando salvamento consolidado em: {merged_output_dir}")
        print("Isso transformará o Adaptador LoRA + Modelo Base em um modelo único HF.")
        
        
        print("💾 Consolidando pesos (save_method='merged_16bit')...")
        model.save_pretrained_merged(
            str(merged_output_dir), 
            tokenizer, 
            save_method="merged_16bit"
        )
        
        print(f"\n✅ SUCESSO! Modelo consolidado salvo em: {merged_output_dir}")
        print("Estrutura salva:")
        print(f" - {merged_output_dir}/model.safetensors (ou bin)")
        print(f" - {merged_output_dir}/config.json")
        print(f" - {merged_output_dir}/tokenizer.json")
        
        print("\n💡 DICA: Agora você pode usar este diretório diretamente no ModelInference")
        print("sem passar o adapter_path!")

    except ImportError:
        print("\n❌ Erro: Unsloth não instalado ou não encontrado.")
    except Exception as e:
        print(f"\n❌ Ocorreu um erro durante a exportação: {e}")

if __name__ == "__main__":
    export_model()
