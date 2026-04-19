"""
Ollama connection test — verifies the local Ollama server is reachable
and lists available models.

Run with:
    python -m ollama_test.connection
"""
import sys
import requests

OLLAMA_HOST = "http://192.168.137.1:11434"


def check_connection() -> bool:
    try:
        r = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
        r.raise_for_status()
    except requests.exceptions.ConnectionError:
        print(f"[FAIL] Could not reach Ollama at {OLLAMA_HOST}")
        print("       Start it with: `ollama serve`")
        return False
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Ollama responded with an error: {e}")
        return False

    models = r.json().get("models", [])
    print(f"[OK] Connected to Ollama at {OLLAMA_HOST}")
    if not models:
        print("     No models installed. Pull one with: `ollama pull llama3.2`")
    else:
        print(f"     Installed models ({len(models)}):")
        for m in models:
            print(f"       - {m.get('name')} ({m.get('size', 0) // (1024 * 1024)} MB)")
    return True


if __name__ == "__main__":
    sys.exit(0 if check_connection() else 1)
