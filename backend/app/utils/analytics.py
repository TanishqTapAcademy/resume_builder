"""Per-request analytics / observability (PRD §11).

Emits ONE structured log line per AI request: latency, model-call count, tokens in/out,
estimated cost, plus endpoint-specific fields (match score, generated pages). Token usage
is gathered across EVERY model call in the request via a contextvar that ai_client writes
into — so nested calls (generate + edits + fact-check) are all counted automatically.

No database (single-user v1) — structured logs are the store (PRD §11).
"""
import contextvars
import json
import logging
import time
from contextlib import contextmanager

logger = logging.getLogger("analytics")

# USD per 1M tokens (input, output). Reference data — update when prices change.
# gpt-5 is intentionally omitted until its price is confirmed; `cost_complete` flags
# any request that used an unpriced model so the cost is never silently wrong.
PRICES: dict[str, tuple[float, float]] = {
    "gpt-4.1": (2.00, 8.00),
    "gpt-4.1-mini": (0.40, 1.60),
    "gpt-4o-mini": (0.15, 0.60),
}

_calls: contextvars.ContextVar = contextvars.ContextVar("ai_calls", default=None)


def record_call(model: str, tokens_in, tokens_out, latency_ms: int, attempt: int) -> None:
    """Record one model call into the active request bucket (no-op outside a request)."""
    bucket = _calls.get()
    if bucket is None:
        return
    bucket.append(
        {
            "model": model,
            "tokens_in": int(tokens_in or 0),
            "tokens_out": int(tokens_out or 0),
            "latency_ms": latency_ms,
            "attempt": attempt,
        }
    )


def _summarize(calls: list[dict]) -> dict:
    tin = sum(c["tokens_in"] for c in calls)
    tout = sum(c["tokens_out"] for c in calls)
    cost = 0.0
    complete = True
    for c in calls:
        price = PRICES.get(c["model"])
        if price is None:
            complete = False  # an unpriced model was used -> cost is partial
            continue
        cost += c["tokens_in"] / 1e6 * price[0] + c["tokens_out"] / 1e6 * price[1]
    return {
        "model_calls": len(calls),
        "tokens_in": tin,
        "tokens_out": tout,
        "cost_usd": round(cost, 6),
        "cost_complete": complete,
    }


@contextmanager
def request_metrics(endpoint: str):
    """Wrap an AI request; emit one structured analytics log line at the end.

    Yields a mutable dict for endpoint-specific fields (e.g. score, pages). Latency,
    token totals, and cost are filled automatically from the calls made inside. Logs
    `ok=False` if the wrapped block raised.
    """
    token = _calls.set([])
    start = time.monotonic()
    record: dict = {"endpoint": endpoint, "ok": False}
    try:
        yield record
        record["ok"] = True
    finally:
        calls = _calls.get() or []
        _calls.reset(token)
        record["latency_ms"] = int((time.monotonic() - start) * 1000)
        record.update(_summarize(calls))
        logger.info("request %s", json.dumps(record))
