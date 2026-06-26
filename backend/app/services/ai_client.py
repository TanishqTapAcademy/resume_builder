"""ai_client.py — the ONLY place that talks to OpenAI (LLM.md §0.5, BACKEND.md §0 rule 1).

Exactly two calls used by the rest of the app:
  - match_json(...)    -> small model, structured JSON   (the /match call)
  - generate_text(...) -> flagship model, raw text/LaTeX  (the /generate call)

Each goes through `_call`, which adds resilience (LLM.md §0): retry-with-backoff on
transient errors, a fallback model if the primary keeps failing, and one structured
log line per call (model, attempt, latency, tokens). Nothing else imports `openai`.
"""
import asyncio
import json
import logging
import time
from typing import Any

from openai import (
    AsyncOpenAI,
    APIConnectionError,
    APIError,
    APITimeoutError,
    BadRequestError,
    RateLimitError,
)

from app.core.config import get_settings
from app.utils.analytics import record_call

logger = logging.getLogger("ai_client")

# Transient errors worth retrying the same model for.
_RETRYABLE = (APIConnectionError, APITimeoutError, RateLimitError)

_client: AsyncOpenAI | None = None


class AIClientError(Exception):
    """Raised when a model call fails after all retries and the fallback model."""


def _get_client() -> AsyncOpenAI:
    """Lazily build a cached async client. Fails clearly if the key is missing."""
    global _client
    settings = get_settings()
    if not settings.openai_api_key:
        raise AIClientError(
            "OPENAI_API_KEY is not set — configure it in .env (LLM.md §0.4)."
        )
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


def _log_call(what: str, model: str, attempt: int, start: float, resp: Any) -> None:
    usage = getattr(resp, "usage", None)
    tokens_in = getattr(usage, "prompt_tokens", 0)
    tokens_out = getattr(usage, "completion_tokens", 0)
    latency_ms = int((time.monotonic() - start) * 1000)
    logger.info(
        "ai_call what=%s model=%s attempt=%d latency_ms=%d tokens_in=%s tokens_out=%s",
        what, model, attempt, latency_ms, tokens_in, tokens_out,
    )
    record_call(model, tokens_in, tokens_out, latency_ms, attempt)


async def _call(*, what: str, models: list[str], **params: Any):
    """Call chat.completions across [primary, fallback] models with retries.

    - transient error -> retry same model with exponential backoff (ai_max_retries)
    - model rejects `temperature` -> drop it and retry (some reasoning models do this)
    - other API error / exhausted retries -> move to the next model
    - all models exhausted -> AIClientError with the collected reasons
    """
    settings = get_settings()
    client = _get_client()
    errors: list[str] = []

    for model in models:
        call_params = dict(params, model=model)
        attempt = 0
        while attempt < settings.ai_max_retries:
            attempt += 1
            start = time.monotonic()
            try:
                resp = await client.chat.completions.create(**call_params)
                _log_call(what, model, attempt, start, resp)
                return resp
            except BadRequestError as exc:
                # e.g. model doesn't support `temperature` — drop it and retry.
                if "temperature" in call_params and "temperature" in str(exc).lower():
                    call_params.pop("temperature")
                    attempt -= 1  # don't count this as a real attempt
                    continue
                errors.append(f"{model}: {exc}")
                break  # non-retryable bad request -> next model
            except _RETRYABLE as exc:
                errors.append(f"{model} attempt {attempt}: {exc}")
                if attempt < settings.ai_max_retries:
                    await asyncio.sleep(settings.ai_backoff_base * 2 ** (attempt - 1))
                    continue
                break  # exhausted -> next model
            except APIError as exc:
                errors.append(f"{model}: {exc}")
                break  # unexpected API error -> next model

    raise AIClientError(f"{what} failed for all models. " + " | ".join(errors))


async def structured_json(
    *, what: str, system: str, user: str, schema: dict, model: str, schema_name: str = "result"
) -> dict:
    """Generic structured-output call → parsed JSON validated against `schema`.

    Shared plumbing for any small-model JSON task (match, fact-check, future PDF parse).
    Temperature is pinned low for stable, deterministic structured output.
    """
    settings = get_settings()
    resp = await _call(
        what=what,
        models=[model, settings.fallback_model],
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {"name": schema_name, "schema": schema, "strict": True},
        },
        temperature=settings.match_temperature,
    )
    return json.loads(resp.choices[0].message.content or "{}")


async def match_json(system: str, user: str, schema: dict, *, model: str | None = None) -> dict:
    """Structured JSON call for matching (the /match call).

    `model` is chosen by the caller based on input size (LLM.md §5); defaults to the
    small match model.
    """
    settings = get_settings()
    return await structured_json(
        what="match",
        system=system,
        user=user,
        schema=schema,
        model=model or settings.gap_model_small,
        schema_name="match_result",
    )


async def generate_text(system: str, user: str) -> str:
    """Flagship-model call → raw text (the full LaTeX, the /generate call)."""
    settings = get_settings()
    resp = await _call(
        what="generate",
        models=[settings.gen_model, settings.fallback_model],
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return resp.choices[0].message.content or ""
