"""
main.py  v2
FastAPI application — three key endpoints:

  GET /api/info         → dynamic coin count + weight budget (call first)
  GET /api/scan         → full scan, returns JSON when complete
  GET /api/scan/stream  → same scan but streams SSE progress events live

Run with:
  uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from binance import (
    BATCH_DELAY,
    BATCH_SIZE,
    KLINE_INTERVAL,
    KLINE_LIMIT,
    MIN_VOLUME_USDT,
    calculate_weight,
    fetch_all_klines,
    get_all_usdt_pairs,
    get_tickers,
)
from analytics import analyse_coin

app = FastAPI(title="Crypto Volatility Scanner", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ── /api/info ─────────────────────────────────────────────────────────────────

@app.get("/api/info")
async def get_info():
    """
    Lightweight pre-flight endpoint.
    Weight used: 20 (exchangeInfo) + 80 (tickers) = 100
    """
    async with httpx.AsyncClient(timeout=30) as client:
        pairs, tickers = await asyncio.gather(
            get_all_usdt_pairs(client),
            get_tickers(client),
        )

    active = [
        p for p in pairs
        if p in tickers
        and float(tickers[p].get("quoteVolume", 0)) >= MIN_VOLUME_USDT
    ]

    count = len(active)
    budget = calculate_weight(count)
    estimated_secs = round((count / BATCH_SIZE) * BATCH_DELAY + 8)

    return {
        "total_pairs": count,
        "min_volume_usdt": MIN_VOLUME_USDT,
        "batch_size": BATCH_SIZE,
        "kline_interval": KLINE_INTERVAL,
        "kline_limit": KLINE_LIMIT,
        "estimated_scan_seconds": estimated_secs,
        "weight": budget,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── shared scan logic ─────────────────────────────────────────────────────────

async def _run_scan(on_progress=None) -> dict:
    started = datetime.now(timezone.utc)

    async with httpx.AsyncClient(timeout=120) as client:
        pairs, tickers = await asyncio.gather(
            get_all_usdt_pairs(client),
            get_tickers(client),
        )

        active = [
            p for p in pairs
            if p in tickers
            and float(tickers[p].get("quoteVolume", 0)) >= MIN_VOLUME_USDT
        ]

        all_klines = await fetch_all_klines(
            client, active, interval=KLINE_INTERVAL, on_progress=on_progress
        )

    coins = []
    for sym, klines in all_klines.items():
        result = analyse_coin(sym, klines, tickers.get(sym, {}))
        if result:
            coins.append(result)

    coins.sort(key=lambda x: x["score"], reverse=True)

    elapsed = (datetime.now(timezone.utc) - started).total_seconds()
    budget = calculate_weight(len(active))

    return {
        "scanned_at": started.isoformat(),
        "elapsed_seconds": round(elapsed, 1),
        "total_pairs_found": len(active),
        "total_scanned": len(coins),
        "kline_interval": KLINE_INTERVAL,
        "weight": budget,
        "coins": coins,
    }


# ── /api/scan (blocking JSON) ─────────────────────────────────────────────────

@app.get("/api/scan")
async def full_scan():
    return await _run_scan()


# ── /api/scan/stream (SSE) ────────────────────────────────────────────────────

@app.get("/api/scan/stream")
async def full_scan_stream():
    """
    Server-Sent Events endpoint.
    Event types:
      {"type": "progress", "done": 50, "total": 423, "pct": 12}
      {"type": "complete", "data": { ...same shape as /api/scan... }}
      {"type": "error",    "message": "..."}
    """
    queue: asyncio.Queue = asyncio.Queue()

    def on_progress(done: int, total: int):
        queue.put_nowait({"type": "progress", "done": done, "total": total,
                          "pct": round(done / total * 100)})

    async def event_generator():
        scan_task = asyncio.create_task(_run_scan(on_progress=on_progress))

        try:
            while not scan_task.done():
                try:
                    event = queue.get_nowait()
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.QueueEmpty:
                    await asyncio.sleep(0.1)

            while not queue.empty():
                event = queue.get_nowait()
                yield f"data: {json.dumps(event)}\n\n"

            result = scan_task.result()
            yield f"data: {json.dumps({'type': 'complete', 'data': result})}\n\n"

        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ── /api/health ───────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
