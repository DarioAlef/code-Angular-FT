import os
import google.generativeai as genai
from utils.config import settings

def list_models():
    genai.configure(api_key=settings.GEMINI_API_KEY)
    print("Modelos disponíveis para você:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name} ({m.display_name})")

if __name__ == "__main__":
    list_models()
