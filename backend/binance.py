"""
binance.py
Async Binance public API client.
No API key required — uses public endpoints only.

Weight budget per scan (free tier limit: 1200/min):
  exchangeInfo  →  20
  ticker/24hr   →  80  (no symbol param)
  klines ×N     →  N × 1
  ─────────────────────
  Total         →  100 + N

All API calls use httpx AsyncClient for optimal performance.
Batching and delays ensure we stay well under rate limits.
"""
from __future__ import annotations

import asyncio
from typing import Callable

import httpx

BASE = "https://api.binance.com/api/v3"

LEVERAGED_SUFFIXES = {"UP", "DOWN", "BEAR", "BULL"}
LEVERAGED_TAGS = {"3L", "3S", "2L", "2S", "HALF", "EDGE"}

BATCH_SIZE = 50
BATCH_DELAY = 0.15
MIN_VOLUME_USDT = 100_000

KLINE_INTERVAL = "1m"
KLINE_LIMIT = 16  # 15 closed + 1 still-forming (dropped by analytics)


def _is_leveraged(base_asset: str) -> bool:
    upper = base_asset.upper()
    if any(upper.endswith(s) for s in LEVERAGED_SUFFIXES):
        return True
    return upper in LEVERAGED_TAGS


# ── Pair discovery ─────────────────────────────────────────────────────────────

async def get_all_usdt_pairs(client: httpx.AsyncClient) -> list[str]:
    """Weight: 20"""
    r = await client.get(f"{BASE}/exchangeInfo")
    r.raise_for_status()
    data = r.json()
    return [
        s["symbol"]
        for s in data["symbols"]
        if s["quoteAsset"] == "USDT"
        and s["status"] == "TRADING"
        and s["isSpotTradingAllowed"]
        and not _is_leveraged(s["baseAsset"])
    ]


# ── Ticker (covers all symbols in one call) ────────────────────────────────────

async def get_tickers(client: httpx.AsyncClient) -> dict[str, dict]:
    """Weight: 80 (no symbol param → all tickers)"""
    r = await client.get(f"{BASE}/ticker/24hr")
    r.raise_for_status()
    return {t["symbol"]: t for t in r.json()}


# ── Klines (batched) ───────────────────────────────────────────────────────────

async def _get_klines_single(
    client: httpx.AsyncClient,
    symbol: str,
    interval: str = KLINE_INTERVAL,
    limit: int = KLINE_LIMIT,
) -> tuple[str, list]:
    """Weight: 1 per call (limit ≤ 499)"""
    try:
        r = await client.get(
            f"{BASE}/klines",
            params={"symbol": symbol, "interval": interval, "limit": limit},
        )
        r.raise_for_status()
        return symbol, r.json()
    except Exception:
        return symbol, []


async def fetch_all_klines(
    client: httpx.AsyncClient,
    symbols: list[str],
    interval: str = KLINE_INTERVAL,
    on_progress: Callable[[int, int], None] | None = None,
) -> dict[str, list]:
    """
    Fetches klines for every symbol in batches of BATCH_SIZE.
    Weight per call: 1  →  total weight: len(symbols)
    """
    results: dict[str, list] = {}
    total = len(symbols)
    done = 0

    for i in range(0, total, BATCH_SIZE):
        batch = symbols[i : i + BATCH_SIZE]
        batch_results = await asyncio.gather(
            *[_get_klines_single(client, sym, interval) for sym in batch]
        )
        for sym, klines in batch_results:
            if klines:
                results[sym] = klines

        done += len(batch)
        if on_progress:
            on_progress(done, total)
        if done < total:
            await asyncio.sleep(BATCH_DELAY)

    return results


# ── Budget calculator ──────────────────────────────────────────────────────────

def calculate_weight(num_symbols: int) -> dict:
    exchange_info = 20
    ticker = 80
    klines = num_symbols * 1
    total = exchange_info + ticker + klines
    limit = 1200
    return {
        "exchange_info": exchange_info,
        "ticker": ticker,
        "klines": klines,
        "total": total,
        "limit": limit,
        "headroom": limit - total,
        "safe": total <= limit,
        "utilization_pct": round(total / limit * 100, 1),
    }
