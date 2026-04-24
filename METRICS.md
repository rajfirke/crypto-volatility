# Metrics & Patterns Guide

This document provides detailed explanations of all volatility metrics and pattern classifications used by the Crypto Volatility Scanner.

---

## Table of Contents

- [Core Concept](#core-concept)
- [Patterns](#patterns)
- [Ranking Metrics](#ranking-metrics)
- [Supporting Metrics](#supporting-metrics)
- [How to Use This Information](#how-to-use-this-information)

---

## Core Concept

The scanner analyzes **15 closed 1-minute candles** for each cryptocurrency pair. For each candle, we calculate the **range percentage**:

```
range% = (High - Low) / Low × 100
```

This measures how much price movement occurred within that 1-minute window. All other metrics are derived from these 15 range values.

---

## Patterns

Patterns classify the overall volatility behavior across the 15-minute window. They help you quickly identify which coins deserve attention and what type of trading opportunity they represent.

### 🔵 **surging** — TRADE NOW
**What it means:** Volatility is exploding in the last few candles. Recent massive price movement.

**Characteristics:**
- Heat ratio > 2.0 (last 5 candles are 2× hotter than first 5)
- Peak range is in the last 4 candles
- Average of last 3 candles is 1.5× higher than overall average

**Trading signal:** **Highest priority for scalping.** This is an active breakout or breakdown. Enter immediately if your strategy confirms the direction.

**Example:** A coin was trading in a 0.05% range for the first 10 minutes, then suddenly jumped to 0.3% ranges in the last 5 candles.

---

### 🟢 **ongoing** — IN PLAY
**What it means:** Sustained high volatility throughout the entire window. Already in active motion.

**Characteristics:**
- Heat ratio > 0.7 (not cooling down)
- At least 50% of candles have range > 1.5× median (sustained move, not isolated spikes)

**Trading signal:** **Good for continuation trades.** The move is already underway and showing consistency. Look for pullbacks or breakouts within the existing trend.

**Example:** A coin has been consistently ranging 0.15-0.25% across all 15 candles with no clear fade.

---

### 🔷 **building** — WATCH
**What it means:** Gradual ramp-up in volatility. Momentum is building but not explosive yet.

**Characteristics:**
- Heat ratio between 1.1 and 2.0 (warming up, but not explosive)
- Peak range is in the last 6-10 candles (recent, but not immediate)

**Trading signal:** **Potential breakout forming.** Monitor closely. Consider entering on confirmation (volume spike, key level break). Don't jump in early.

**Example:** Ranges steadily increasing from 0.03% → 0.08% → 0.12% over the 15-minute window.

---

### 🟡 **spiking** — CAUTION
**What it means:** Single massive candle with quiet surrounding action. One-off event.

**Characteristics:**
- Spike score > 4.0 (max range is 4× the median)
- Sustained count ≤ 3 (only a few candles are hot)

**Trading signal:** **Avoid FOMO on isolated spikes.** This was likely a liquidity grab, stop hunt, or news reaction. The move may not continue. Wait for follow-through before entering.

**Example:** 14 candles with 0.05% range, one candle with 0.40% range, then back to 0.05%.

---

### 🔴 **fading** — MISSED IT
**What it means:** Was hot but now cooling down. Volatility declining in recent candles.

**Characteristics:**
- Heat ratio < 0.7 (recent candles are cooler than early candles)
- Overall average still elevated (it was volatile earlier)

**Trading signal:** **Look for re-entry only.** The initial move is over. Wait for consolidation and a new setup. Don't chase a fading move.

**Example:** First 5 candles averaged 0.20% range, last 5 candles averaged 0.08% range.

---

### ⚪ **flat** — SKIP
**What it means:** Minimal volatility, nothing happening. Low ranges throughout.

**Characteristics:**
- Overall average range < 0.03-0.08%
- Heat ratio near 1.0 (no change in energy)

**Trading signal:** **No trading opportunity.** This coin is dead in the water. Move on to more active pairs.

**Example:** All 15 candles with 0.02-0.04% range. No price action.

---

## Ranking Metrics

These are the primary metrics used to **rank and sort** coins. They help you find the best trading opportunities.

### **Score** (Primary Ranking)
**Formula:** Exponential recency-weighted sum across 15 candles.

**How it works:**
- Each candle's range is multiplied by a weight
- Weight formula: `w_i = 2^(i / (n-1))`
- Last candle weighs **2× the first candle**
- Weights are normalized to sum to 1

**What it tells you:** Overall volatility with emphasis on recent action. Higher score = more volatile, with recent activity weighted heavily.

**Use case:** Default sorting metric. Shows you the hottest coins right now.

**Example values:**
- Score 0.15 = moderate volatility
- Score 0.30 = high volatility (worth watching)
- Score 0.50+ = extreme volatility (prime scalping target)

---

### **Heat** (Most Actionable for Scalping)
**Formula:** `Avg(last 5 candles) ÷ Avg(first 5 candles)`

**What it tells you:**
- **Heat > 1.0** = Getting hotter (volatility increasing)
- **Heat < 1.0** = Cooling down (volatility decreasing)
- **Heat > 2.0** = Explosive acceleration (surging pattern)
- **Heat < 0.5** = Significant fade (avoid)

**Use case:** The single most actionable metric for scalping. Sort by heat to find coins that are **accelerating right now**.

**Example:** First 5 candles averaged 0.05% range, last 5 averaged 0.15% → Heat = 3.0× (very hot!)

---

### **Spike Score**
**Formula:** `Max range ÷ Median range`

**What it tells you:**
- **Spike > 3-4** = One candle dominates (isolated event, caution)
- **Spike ~ 1-2** = Uniform ranges (sustained move, more reliable)

**Use case:** Identify false breakouts and isolated spikes. High spike scores mean the move is **not sustained**.

**Example:**
- Median range = 0.05%, Max range = 0.40% → Spike = 8× (probably a fake-out)
- Median range = 0.10%, Max range = 0.15% → Spike = 1.5× (sustained move)

---

### **Max Range**
**Formula:** Highest `(High-Low)/Low%` across all 15 candles.

**What it tells you:** The peak volatility moment in the window. Shows the biggest single-candle move.

**Use case:** Find coins that had massive single-candle moves. Good for identifying breakout candidates, but check spike score to confirm it's not isolated.

**Example:** Max range 0.80% means one candle had 0.80% from low to high.

---

## Supporting Metrics

These metrics provide additional context and help refine your trading decisions.

### **Momentum**
**Formula:** `(Avg(last 3) - Avg(first 3)) / Avg(first 3) × 100`

**What it tells you:**
- **Positive momentum** = Volatility accelerating
- **Negative momentum** = Volatility decelerating

**Use case:** Confirms the trend in volatility. Positive momentum + high heat = strong confirmation of building/surging pattern.

**Example:** First 3 avg = 0.05%, Last 3 avg = 0.12% → Momentum = +140%

---

### **Acceleration**
**Formula:** Average of step-by-step deltas between consecutive candles.

**What it tells you:** Rate of change in volatility. Positive = volatility is speeding up, negative = slowing down.

**Use case:** Helps identify whether momentum is building or fading. Similar to momentum but more granular.

---

### **Consistency**
**Formula:** `1 - (std_dev / mean)`

**What it tells you:**
- **High consistency (0.6-0.9)** = Uniform volatility, steady move
- **Low consistency (0-0.3)** = Erratic spikes, unpredictable

**Use case:** Identify reliable vs choppy moves. High consistency + high score = trustworthy trading signal. Low consistency = avoid (too erratic).

**Example:**
- Consistent move: all candles 0.15-0.20% → Consistency = 0.85
- Erratic move: candles ranging 0.02%, 0.30%, 0.05%, 0.25% → Consistency = 0.20

---

### **Streak**
**Formula:** Longest run of consecutive increasing ranges ending near the last candle (within last 3 positions).

**What it tells you:** How many candles in a row had increasing volatility. Longer streak = stronger sustained build-up.

**Use case:** Confirm building/surging patterns. A streak of 5+ candles means momentum is genuinely building, not just random noise.

**Example:** Ranges: 0.05, 0.06, 0.08, 0.10, 0.12, 0.15 → Streak = 6

---

### **Peak Position**
**Formula:** `Index of max range ÷ (n-1)` (normalized 0-1)

**What it tells you:**
- **1.0** = Peak is the newest candle (still hot!)
- **0.5** = Peak is in the middle (could be fading)
- **0.0** = Peak was the oldest candle (already faded)

**Use case:** Determine if the volatility is current or in the past. Only trade if peak position > 0.6 (peak is recent).

**Example:** Max range at candle 14 of 15 → Peak position = 0.93 (very recent)

---

### **Sustained Count**
**Formula:** Number of candles with `range > 1.5× median`

**What it tells you:**
- **High count (8-15)** = Many candles are hot (sustained move)
- **Low count (1-3)** = Only a few hot candles (isolated spikes)

**Use case:** Differentiate sustained moves from isolated spikes. Look for sustained count > 5 for reliable trades.

**Example:** Median = 0.10%, 9 candles > 0.15% → Sustained count = 9 (good sustained move)

---

### **15m Price Change (Δ)**
**Formula:** `(Last close - First open) / First open × 100`

**What it tells you:** Total directional price change over the 15-minute window.

**What it means:**
- **Positive** = Price went up (bullish volatility)
- **Negative** = Price went down (bearish volatility)

**Use case:** Understand the directional bias. High volatility (score) + positive Δ = bullish breakout. High volatility + negative Δ = bearish breakdown.

**Example:** Opened at $1.00, closed at $1.05 → Δ = +5.0%

---

### **24h Volume**
**Formula:** Total quote-asset volume (USDT) over 24 hours from Binance ticker data.

**What it tells you:** Overall trading activity and liquidity.

**Use case:** Filter out low-volume coins that may have unreliable price action or poor execution. Prefer coins with > $1M daily volume for safer trades.

**Example:** $5.2M = good liquidity, $80K = very low liquidity (risky)

---

## How to Use This Information

### Recommended Workflow

1. **Sort by Score** (default) → See overall hottest coins
2. **Filter by Pattern:**
   - `surging` → Immediate scalp opportunities
   - `ongoing` → Active trades in motion
   - `building` → Potential breakouts to watch
3. **Check Heat:** Is it getting hotter (>1.5) or cooling (<0.8)?
4. **Check Spike Score:** Is this a sustained move (<3) or isolated spike (>4)?
5. **Check Consistency:** Is the move reliable (>0.5) or erratic (<0.3)?
6. **Check Volume:** Is there enough liquidity (>$500k)?
7. **Check 15m Δ:** What's the directional bias?

### Red Flags (Avoid These)

- **Spiking pattern + High spike score (>5)** = Fake-out, isolated event
- **Fading pattern + Heat < 0.5** = Move is over, don't chase
- **Low consistency (<0.3) + Erratic ranges** = Unpredictable, high risk
- **Low volume (<$100k)** = Poor liquidity, avoid
- **Flat pattern** = No opportunity, skip

### Green Flags (Prime Targets)

- **Surging pattern + Heat > 2.0 + Consistency > 0.5** = Strong scalp signal
- **Ongoing pattern + Sustained count > 7 + High volume** = Reliable continuation
- **Building pattern + Streak > 5 + Peak position > 0.8** = Breakout forming
- **High score + Low spike score (<2) + Positive momentum** = Sustained move

---

## Advanced Tips

### Combining Metrics

**Best scalp setups:**
```
Pattern: surging
Heat: > 2.5
Score: > 0.30
Spike: < 3.0
Consistency: > 0.5
Volume: > $1M
```

**Best continuation trades:**
```
Pattern: ongoing
Heat: > 1.2
Sustained count: > 8
Spike: < 2.5
15m Δ: Strong directional bias
```

**Best breakout watches:**
```
Pattern: building
Streak: > 5
Heat: 1.4 - 2.0
Peak position: > 0.7
Momentum: Positive and increasing
```

### Time-Based Strategy

Since this uses **1-minute candles**, the data is extremely fresh:
- **Auto-refresh every 60 seconds** to catch new breakouts
- **Sort by Heat** during volatile market hours (US/EU sessions)
- **Look for building patterns** early in trading sessions
- **Avoid fading patterns** unless waiting for re-entry

### Risk Management

- Always confirm with your own chart analysis before entering
- Check order book depth on high-spike coins (may be thin liquidity)
- Use tight stop-losses on high-volatility trades
- Prefer coins with consistent patterns over erratic ones
- Never trade based solely on one metric — use the full picture

---

## Summary

| Metric | What It Shows | Best Use |
|--------|---------------|----------|
| **Score** | Overall volatility with recency weighting | Primary ranking |
| **Heat** | Is it getting hotter or cooler? | Most actionable for scalping |
| **Spike Score** | Sustained move vs isolated spike | Filter out fake-outs |
| **Pattern** | Current market behavior | Quick classification |
| **Consistency** | Reliable vs erratic | Assess trade quality |
| **Sustained Count** | How many candles are hot | Confirm sustained moves |
| **Peak Position** | Is volatility current or past? | Timing |
| **15m Δ** | Directional bias | Understand trend direction |
| **Volume** | Liquidity | Safety check |

**Remember:** This scanner finds **volatility**, not **direction**. You still need to determine whether to go long or short based on your own analysis (chart patterns, support/resistance, order flow, etc.). Use this tool to find **which coins to watch**, then apply your strategy to decide **how to trade them**.

---

**Happy trading!** 📈
