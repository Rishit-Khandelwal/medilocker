import json
import logging

import requests as http_requests
from django.conf import settings

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = getattr(settings, "OLLAMA_MODEL",    "llama3.2:3b")
GEMINI_API_KEY  = getattr(settings, "GEMINI_API_KEY",  "")
GEMINI_MODEL    = "gemini-1.5-flash"   # free tier


def is_ollama_available():
    try:
        resp = http_requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
        return resp.status_code == 200
    except Exception:
        return False


def stream_ollama(messages, model=None):
    """
    messages: list of {role: system/user/assistant, content} dicts.
    Yields token strings.
    """
    model = model or OLLAMA_MODEL
    try:
        resp = http_requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={"model": model, "messages": messages, "stream": True},
            stream=True,
            timeout=300,
        )
        if not resp.ok:
            try:
                err = resp.json().get("error", "Unknown error")
            except Exception:
                err = f"HTTP {resp.status_code}"
            raise RuntimeError(
                f"Ollama error: {err}. "
                f"Ensure the model is pulled: ollama pull {model}"
            )
        for line in resp.iter_lines():
            if not line:
                continue
            chunk = json.loads(line)
            token = chunk.get("message", {}).get("content", "")
            if token:
                yield token
            if chunk.get("done"):
                break
    except RuntimeError:
        raise
    except Exception as exc:
        logger.error(f"Ollama streaming error: {exc}")
        raise RuntimeError(
            f"Ollama unreachable at {OLLAMA_BASE_URL}. "
            "Run `ollama serve` and pull a model with `ollama pull llama3.2:3b`."
        ) from exc


def stream_gemini(messages, system_prompt=""):
    """
    messages: list of {role: user/assistant, content} dicts.
    Last message must be from the user (current query).
    Yields token strings.
    """
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY not set. "
            "Get a free key at https://aistudio.google.com/app/apikey and add it to .env"
        )
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)

        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=system_prompt or None,
        )

        # Gemini requires history to alternate user/model — split off current message
        history_msgs = messages[:-1]
        current_text = messages[-1]["content"]

        gemini_history = [
            {
                "role":  "model" if m["role"] == "assistant" else "user",
                "parts": [m["content"]],
            }
            for m in history_msgs
        ]

        chat     = model.start_chat(history=gemini_history)
        response = chat.send_message(current_text, stream=True)

        for chunk in response:
            try:
                text = chunk.text
                if text:
                    yield text
            except Exception:
                pass  # Gemini safety filter may skip a chunk

    except RuntimeError:
        raise
    except Exception as exc:
        logger.error(f"Gemini streaming error: {exc}")
        raise RuntimeError(f"Gemini error: {exc}") from exc


def stream_response(messages, system_prompt=""):
    """
    Primary entry point. Returns (token_generator, provider_name).
    Auto-detects: Ollama first → Gemini → clear error if neither available.
    """
    ai_provider = getattr(settings, "AI_PROVIDER", "auto")

    if ai_provider == "gemini":
        return stream_gemini(messages, system_prompt), "gemini"

    if ai_provider == "ollama":
        full_msgs = [{"role": "system", "content": system_prompt}] + messages
        return stream_ollama(full_msgs), "ollama"

    # auto: try Ollama first
    if is_ollama_available():
        full_msgs = [{"role": "system", "content": system_prompt}] + messages
        return stream_ollama(full_msgs), "ollama"

    if GEMINI_API_KEY:
        return stream_gemini(messages, system_prompt), "gemini"

    raise RuntimeError(
        "No AI backend available. "
        "Option A (local, fully free): install Ollama from https://ollama.com, "
        "run `ollama serve`, then `ollama pull llama3.2:3b`. "
        "Option B (cloud, free tier): get a free API key at "
        "https://aistudio.google.com/app/apikey and set GEMINI_API_KEY in .env"
    )