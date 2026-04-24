"""
analytics.py  v2
All pure-python calculations on kline data.
Designed for 15 × 1m candles — optimised for scalp-trading signals.

This module provides volatility analytics for cryptocurrency trading.
No external dependencies beyond Python standard library.
"""
from __future__ import annotations

from statistics import median

NUM_CANDLES = 15


# ── Candle helpers ─────────────────────────────────────────────────────────────

def range_pct(candle: list) -> float:
    """(High - Low) / Low * 100"""
    low = float(candle[3])
    high = float(candle[2])
    return ((high - low) / low * 100) if low > 0 else 0.0


def candle_direction(candle: list) -> str:
    return "green" if float(candle[4]) >= float(candle[1]) else "red"


def candle_volume(candle: list) -> float:
    """Quote-asset volume (index 7)."""
    return float(candle[7])


# ── Scoring (15-candle exponential weighting) ──────────────────────────────────

def weighted_score(ranges: list[float]) -> float:
    """
    Exponential recency weighting across all candles.
    w_i = 2^(i / (n-1))  →  last candle weighs 2× the first.
    Normalised so weights sum to 1.

    This is the primary ranking metric for identifying high-volatility coins.
    """
    n = len(ranges)
    if n < 2:
        return 0.0
    raw = [2.0 ** (i / (n - 1)) for i in range(n)]
    total_w = sum(raw)
    return sum(r * w / total_w for r, w in zip(ranges, raw))


# ── Momentum & acceleration ───────────────────────────────────────────────────

def momentum(ranges: list[float]) -> float:
    """
    Avg of last 3 vs avg of first 3, expressed as % change.
    More stable than single-candle comparison.
    """
    if len(ranges) < 6:
        return 0.0
    early = sum(ranges[:3]) / 3
    late = sum(ranges[-3:]) / 3
    return ((late - early) / max(early, 0.001)) * 100


def acceleration(ranges: list[float]) -> float:
    """Average of step-by-step deltas."""
    if len(ranges) < 2:
        return 0.0
    deltas = [ranges[i + 1] - ranges[i] for i in range(len(ranges) - 1)]
    return sum(deltas) / len(deltas)


def consistency(ranges: list[float]) -> float:
    """
    1 - (std_dev / mean). Higher = more uniform volatility.

    Measures how steady the volatility is across the window.
    High consistency = sustained move, Low consistency = erratic spikes.
    """
    n = len(ranges)
    if n < 2:
        return 0.0
    mean = sum(ranges) / n
    if mean == 0.0:
        return 0.0
    variance = sum((r - mean) ** 2 for r in ranges) / n
    std = variance ** 0.5
    return max(0.0, 1.0 - (std / mean))


# ── New high-range identification metrics ─────────────────────────────────────

def recent_heat(ranges: list[float]) -> float:
    """
    Avg of last 5 candles / avg of first 5 candles.
    >1.0 = getting hotter.  <1.0 = cooling down.
    The single most actionable metric for scalping.
    """
    if len(ranges) < 10:
        return 1.0
    early = sum(ranges[:5]) / 5
    late = sum(ranges[-5:]) / 5
    return late / max(early, 0.001)


def spike_score(ranges: list[float]) -> float:
    """
    max_range / median_range.
    High values (>3) = one candle dominates → single event, may not repeat.
    Low values (~1) = uniform ranges → sustained move.
    """
    if len(ranges) < 3:
        return 1.0
    med = median(ranges)
    return max(ranges) / max(med, 0.001)


def streak_count(ranges: list[float]) -> int:
    """
    Longest run of consecutive increasing ranges ending at or near
    the last candle (within last 2 positions). Longer = stronger build-up.
    """
    if len(ranges) < 2:
        return 0
    best = 0
    best_end = 0
    run = 1
    for i in range(1, len(ranges)):
        if ranges[i] >= ranges[i - 1]:
            run += 1
        else:
            if run > best:
                best = run
                best_end = i - 1
            run = 1
    if run > best:
        best = run
        best_end = len(ranges) - 1
    # only count streaks that end in the last 3 candles as "active"
    if best_end >= len(ranges) - 3:
        return best
    return 0


def peak_position(ranges: list[float]) -> float:
    """
    Index of the highest range normalised to 0-1.
    1.0 = peak is the newest candle (still hot).
    0.0 = peak was the oldest candle (already faded).
    """
    if len(ranges) < 2:
        return 0.0
    idx = ranges.index(max(ranges))
    return idx / (len(ranges) - 1)


def sustained_count(ranges: list[float]) -> int:
    """How many candles have range > 1.5× the median. More = sustained move."""
    if len(ranges) < 3:
        return 0
    med = median(ranges)
    threshold = med * 1.5
    return sum(1 for r in ranges if r > threshold)


# ── Pattern classification (15-candle aware) ──────────────────────────────────

def classify_pattern(ranges: list[float]) -> str:
    """
    Patterns for 15 × 1m candles:
      surging  – volatility exploding in the last few candles  (TRADE NOW)
      ongoing  – sustained high volatility throughout          (IN PLAY)
      building – gradual ramp-up across the window             (WATCH)
      spiking  – single massive candle, rest quiet             (CAUTION)
      fading   – was hot, now cooling down                     (MISSED IT)
      flat     – nothing happening                             (SKIP)
    """
    n = len(ranges)
    if n < 6:
        return "unknown"

    avg = sum(ranges) / n
    med = median(ranges)

    if avg < 0.03:
        return "flat"

    heat = recent_heat(ranges)
    spike = spike_score(ranges)
    max_i = ranges.index(max(ranges))
    last_3_avg = sum(ranges[-3:]) / 3
    sus = sustained_count(ranges)

    # Surging: recent candles dramatically higher, peak is very recent
    if heat > 2.0 and max_i >= n - 4 and last_3_avg > avg * 1.5:
        return "surging"

    # Spiking: one candle dominates everything, few sustained
    if spike > 4.0 and sus <= 3:
        return "spiking"

    # Ongoing: many candles are hot, and it hasn't faded
    if sus >= n * 0.5 and heat > 0.7:
        return "ongoing"

    # Building: getting hotter but not explosive yet
    if heat > 1.4 and max_i >= n - 6:
        return "building"

    # Fading: was volatile, now quiet
    if heat < 0.4 and avg > 0.05:
        return "fading"

    if avg < 0.08:
        return "flat"

    # Mild fading
    if heat < 0.7:
        return "fading"

    # Mild building
    if heat > 1.1:
        return "building"

    return "flat"


# ── Full coin analytics ───────────────────────────────────────────────────────

def analyse_coin(
    symbol: str,
    klines: list[list],
    ticker: dict,
) -> dict | None:
    """
    Expects 16 raw klines (limit=16 from API).
    Drops the still-forming candle, analyses the 15 closed ones.
    """
    closed = klines[:-1][-NUM_CANDLES:]
    if len(closed) < 10:
        return None

    ranges = [range_pct(c) for c in closed]
    directions = [candle_direction(c) for c in closed]

    score = weighted_score(ranges)
    mom = momentum(ranges)
    acc = acceleration(ranges)
    con = consistency(ranges)
    pat = classify_pattern(ranges)
    heat = recent_heat(ranges)
    spike = spike_score(ranges)
    streak = streak_count(ranges)
    peak_pos = peak_position(ranges)
    sus = sustained_count(ranges)

    price_open = float(closed[0][1])
    price_close = float(closed[-1][4])
    price_change = ((price_close - price_open) / price_open * 100) if price_open > 0 else 0.0

    return {
        "symbol": symbol,
        "base": symbol.replace("USDT", ""),
        "price": float(ticker.get("lastPrice", 0)),
        "vol24h_usdt": float(ticker.get("quoteVolume", 0)),
        "price_change_24h": float(ticker.get("priceChangePercent", 0)),
        # 15-candle detail
        "ranges": [round(r, 4) for r in ranges],
        "directions": directions,
        # core analytics
        "pattern": pat,
        "score": round(score, 4),
        "momentum": round(mom, 2),
        "acceleration": round(acc, 4),
        "consistency": round(con, 4),
        "max_range": round(max(ranges), 4),
        "avg_range": round(sum(ranges) / len(ranges), 4),
        # new scalping metrics
        "heat": round(heat, 2),
        "spike_score": round(spike, 2),
        "streak": streak,
        "peak_position": round(peak_pos, 2),
        "sustained_count": sus,
        "price_change_15m": round(price_change, 2),
    }
