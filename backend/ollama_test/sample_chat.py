"""
Sample Ollama generate — sends a prompt to a local Ollama model and prints
the reply. Uses /api/generate with streaming so large models (e.g. gpt-oss:20b)
don't trip client timeouts while loading.

Mirrors:
    curl http://192.168.137.1:11434/api/generate \\
      -d '{"model": "gpt-oss:20b", "prompt": "Hello, Ollama!"}'

Run with:
    python -m ollama_test.sample_chat
    python -m ollama_test.sample_chat gpt-oss:20b
"""
import json
import sys
import requests

OLLAMA_HOST = "http://192.168.137.1:11434"
DEFAULT_MODEL = "gpt-oss:20b"

# (connect_timeout, read_timeout). Read timeout is per-chunk when streaming,
# so a cold 20B load won't blow past it the way a single 120s wall would.
TIMEOUT = (10, 600)


def generate(model: str, prompt: str) -> str:
    with requests.post(
        f"{OLLAMA_HOST}/api/generate",
        json={"model": model, "prompt": prompt, "stream": True},
        timeout=TIMEOUT,
        stream=True,
    ) as r:
        r.raise_for_status()
        chunks: list[str] = []
        for line in r.iter_lines(decode_unicode=True):
            if not line:
                continue
            data = json.loads(line)
            if "error" in data:
                raise RuntimeError(data["error"])
            piece = data.get("response", "")
            if piece:
                chunks.append(piece)
                print(piece, end="", flush=True)
            if data.get("done"):
                break
        print()
        return "".join(chunks)


def main() -> int:
    model = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_MODEL
    prompts = [
        "In two sentences, what is a REST API?",
        "Give one real-world example of a REST API.",
    ]

    print(f"--- model: {model} ---")

    for prompt in prompts:
        print(f"\n> {prompt}\n")
        try:
            generate(model, prompt)
        except requests.exceptions.ConnectionError:
            print(f"[FAIL] Could not reach Ollama at {OLLAMA_HOST}. Is `ollama serve` running?")
            return 1
        except requests.exceptions.HTTPError as e:
            print(f"[FAIL] {e}  — is `{model}` pulled? Try: `ollama pull {model}`")
            return 1
        except requests.exceptions.ReadTimeout:
            print("[FAIL] Read timeout — model is taking longer than 600s to produce a token.")
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
