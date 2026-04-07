import logging
import sys
from src.models.inference import ModelInference
from src.utils.config import settings

logging.basicConfig(level=logging.ERROR)

def start_chat():
    print("\n" + "="*50)
    print("🚀 FPFtech Angular Coder - Chat Interativo")
    print("="*50)
    print(f"Carregando modelo base: {settings.model_id}")
    print(f"Aplicando adaptador de: {settings.paths.adapter_dir}")
    print("Configurado para 4-bit (economiza VRAM)...")
    
    inference = ModelInference(
        model_id=settings.model_id,
        adapter_path=str(settings.paths.adapter_dir),
        load_in_4bit=True
    )
    
    try:
        inference.load_with_adapter()
    except Exception as e:
        print(f"\n❌ Erro ao carregar modelo: {e}")
        print("\nCertifique-se de que o adaptador existe no caminho configurado.")
        return

    print("\n✅ Modelo pronto! Digite sua instrução para gerar um componente Angular.")
    print("Exemplo: 'Crie um componente de formulário para cadastro de usuários com validação de email.'")
    print("(Digite 'sair' ou 'exit' para encerrar)\n")

    while True:
        try:
            prompt = input("👤 VOCÊ: ")
            
            if prompt.lower() in ["sair", "exit", "quit"]:
                print("👋 Até logo!")
                break
                
            if not prompt.strip():
                continue

            print("\n🤖 FPFtech Coder (Gerando...):")
            print("-" * 30)
            
            response = inference.generate_code(
                prompt,
                max_tokens=settings.inference_max_tokens,
                temperature=settings.inference_temperature
            )
            
            print(response)
            print("-" * 30 + "\n")
            
        except KeyboardInterrupt:
            print("\n\n👋 Até logo!")
            break
        except Exception as e:
            print(f"\n❌ Ocorreu um erro durante a geração: {e}")

if __name__ == "__main__":
    start_chat()
