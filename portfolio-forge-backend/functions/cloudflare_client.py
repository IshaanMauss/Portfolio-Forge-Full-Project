"""Thin client for Cloudflare Workers AI.

Secrets are declared as SecretParams and read lazily (`.value`) at request
time - they are only available at runtime, and the function must list them in
`secrets=[...]` (see main.py).
"""
import logging
import os

import requests
from firebase_functions.params import SecretParam

CF_API_KEY = SecretParam("CF_API_KEY")
CF_ACCOUNT_ID = SecretParam("CF_ACCOUNT_ID")

# Override with the CF_MODEL environment variable if you switch models.
DEFAULT_MODEL = "@cf/mistral/mistral-7b-instruct-v0.1"

logger = logging.getLogger(__name__)


class AIError(Exception):
    """Raised when the AI provider fails. The message is safe to log, not to show users."""


def generate_ai_content(system_prompt: str, user_text: str, max_tokens: int = 300) -> str:
    account_id = CF_ACCOUNT_ID.value
    api_key = CF_API_KEY.value
    if not account_id or not api_key:
        raise AIError("Cloudflare secrets are not configured")

    model = os.environ.get("CF_MODEL", DEFAULT_MODEL)
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}"
    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        "max_tokens": max_tokens,
    }

    try:
        response = requests.post(
            url, headers={"Authorization": f"Bearer {api_key}"}, json=payload, timeout=25
        )
        response.raise_for_status()
        text = (response.json().get("result") or {}).get("response")
    except requests.exceptions.Timeout as exc:
        raise AIError("Cloudflare request timed out") from exc
    except requests.exceptions.HTTPError as exc:
        # Log upstream details server-side only; never return them to the browser.
        logger.error("Cloudflare HTTP error: %s", exc.response.text[:500])
        raise AIError(f"Cloudflare returned HTTP {exc.response.status_code}") from exc
    except (requests.exceptions.RequestException, ValueError) as exc:
        raise AIError("Cloudflare request failed") from exc

    if not isinstance(text, str) or not text.strip():
        raise AIError("Cloudflare returned an empty response")
    return text.strip()
