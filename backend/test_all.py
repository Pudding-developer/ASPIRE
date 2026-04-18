import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

models_to_test = [
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemma-3-1b-it"
]

for m in models_to_test:
    print(f"\nTesting {m}...")
    try:
        model = genai.GenerativeModel(m)
        response = model.generate_content("hello")
        print("Success:", response.text)
    except Exception as e:
        print("Error:", type(e).__name__, str(e)[:150])

