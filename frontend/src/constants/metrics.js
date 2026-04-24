/**
 * Metric and pattern descriptions for tooltips
 */

export const PATTERN_DESCRIPTIONS = {
  surging: 'Volatility exploding in the last few candles. Recent massive price movement. TRADE NOW - highest priority for scalping.',
  ongoing: 'Sustained high volatility throughout the entire window. Already in play with consistent action. IN PLAY - good for continuation trades.',
  building: 'Gradual ramp-up in volatility across the window. Momentum is building but not explosive yet. WATCH - potential breakout forming.',
  spiking: 'Single massive candle with quiet surrounding action. One-off event, may not repeat. CAUTION - avoid FOMO on isolated spikes.',
  fading: 'Was hot but now cooling down. Volatility declining in recent candles. MISSED IT - look for re-entry only.',
  flat: 'Minimal volatility, nothing happening. Low ranges throughout. SKIP - no trading opportunity.',
}

export const METRIC_DESCRIPTIONS = {
  score: 'Weighted volatility score using exponential recency weighting. Last candle weighs 2× the first. Primary ranking metric.',
  heat: 'Avg(last 5 candles) ÷ Avg(first 5 candles). >1.0 = getting hotter, <1.0 = cooling down. Most actionable metric for scalping.',
  spike_score: 'Max range ÷ Median range. High values (>3) = one candle dominates. Low values (~1) = uniform sustained move.',
  max_range: 'Highest (High-Low)/Low% across all 15 candles. Shows the peak volatility moment in the window.',
  momentum: 'Avg(last 3 candles) vs Avg(first 3 candles) as % change. Positive = accelerating, negative = decelerating.',
  acceleration: 'Average of step-by-step deltas between consecutive candles. Measures rate of change in volatility.',
  consistency: '1 - (std_dev / mean). Higher = uniform volatility, lower = erratic spikes. Steady moves score higher.',
  streak: 'Longest run of consecutive increasing ranges ending near the last candle. Longer = stronger sustained build-up.',
  peak_position: 'Where the highest range sits (0.0 = oldest candle, 1.0 = newest candle). 1.0 = still hot, 0.0 = already faded.',
  sustained_count: 'Number of candles with range > 1.5× median. More = sustained move, less = isolated spikes.',
  price_change_15m: 'Total price change over the 15-minute window (first open to last close). Shows directional bias.',
  vol24h: '24-hour trading volume in USDT. Higher volume = more liquidity and reliability.',
  pattern: 'Classification based on volatility pattern analysis. Identifies the current market behavior.',
}

export const SORT_DESCRIPTIONS = {
  score: 'Sort by weighted volatility score (highest first)',
  heat: 'Sort by heat ratio - find coins getting hotter (highest first)',
  spike_score: 'Sort by spike score - find isolated spike events (highest first)',
  max_range: 'Sort by maximum range - find biggest single-candle moves (highest first)',
  fading: 'Sort by heat ratio - find coins cooling down (lowest first)',
  vol24h: 'Sort by 24h volume - find most liquid pairs (highest first)',
}
