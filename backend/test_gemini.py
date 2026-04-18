import os
import asyncio
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL")

print(f"Key: {api_key[:5]}...")
print(f"Model: {model_name}")

from litellm import completion

try:
    response = completion(
        model=model_name,
        messages=[{"role": "user", "content": "Hello"}],
        api_key=api_key
    )
    print("Success:", response.choices[0].message.content)
except Exception as e:
    print("Error Type:", type(e))
    print("Error Message:", str(e))
