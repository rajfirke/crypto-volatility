# Contributing to Crypto Volatility Scanner

Thank you for considering contributing to this project! 🎉

## Ways to Contribute

- 🐛 **Report bugs** — Open an issue with details and reproduction steps
- 💡 **Suggest features** — Share ideas via GitHub Discussions or Issues
- 📖 **Improve documentation** — Fix typos, clarify explanations, add examples
- 🔧 **Submit code** — Fix bugs, add features, optimize performance
- 🧪 **Test** — Try the app, report edge cases, suggest improvements

---

## Development Setup

### Prerequisites

- Python 3.11+ (`python3 --version`)
- Node.js 18+ (`node --version`)
- npm or yarn

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/crypto-volatility.git
cd crypto-volatility

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup (in a new terminal)
cd frontend
npm install
```

### Run Locally

```bash
# Terminal 1 — Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Code Guidelines

### Python (Backend)

- **Follow PEP 8** — Use 4 spaces for indentation, max line length 100
- **Type hints** — Use `from __future__ import annotations` and type all function signatures
- **Keep analytics pure** — No external dependencies beyond Python standard library
- **Docstrings** — Add concise docstrings explaining what functions do, not how
- **No magic numbers** — Use named constants at the top of files

**Example:**
```python
def calculate_heat(ranges: list[float]) -> float:
    """
    Avg(last 5 candles) ÷ Avg(first 5 candles).
    >1.0 = getting hotter, <1.0 = cooling down.
    """
    if len(ranges) < 10:
        return 1.0
    early = sum(ranges[:5]) / 5
    late = sum(ranges[-5:]) / 5
    return late / max(early, 0.001)
```

### JavaScript/React (Frontend)

- **Use functional components** — No class components
- **Hooks over classes** — `useState`, `useEffect`, `useMemo`, `useCallback`
- **Keep components small** — Split large components into smaller ones
- **CSS Modules** — Use `*.module.css` for scoped styles
- **No inline styles** — Except for dynamic values (e.g., pattern colors)
- **Prefer `const`** — Avoid `let` unless reassignment is needed

**Example:**
```jsx
export default function MetricBadge({ value, threshold }) {
  const color = value >= threshold ? 'var(--green)' : 'var(--red)'
  return (
    <span className={styles.badge} style={{ color }}>
      {value.toFixed(2)}
    </span>
  )
}
```

---

## Adding New Metrics

If you want to add a new volatility metric:

### 1. Add the calculation in `backend/analytics.py`

```python
def new_metric(ranges: list[float]) -> float:
    """Brief description of what this measures."""
    # Your calculation here
    return result
```

### 2. Include it in `analyse_coin()` function

```python
def analyse_coin(symbol: str, klines: list[list], ticker: dict) -> dict | None:
    # ... existing code ...
    new_val = new_metric(ranges)
    
    return {
        # ... existing fields ...
        "new_metric": round(new_val, 2),
    }
```

### 3. Add a description in `frontend/src/constants/metrics.js`

```js
export const METRIC_DESCRIPTIONS = {
  // ... existing metrics ...
  new_metric: 'What this metric measures and how to use it.',
}
```

### 4. Display it in `frontend/src/components/CoinTable.jsx`

Add a column header with tooltip:
```jsx
<span className={styles.right}>
  New Metric
  <InfoIcon text={METRIC_DESCRIPTIONS.new_metric} />
</span>
```

Add the cell value:
```jsx
<span className={`${styles.mono} ${styles.right}`}>
  {fmt(coin.new_metric, 2)}
</span>
```

### 5. Document it in `METRICS.md`

Add a section explaining:
- What it measures
- How it's calculated
- When to use it
- Example values

---

## Adding New Patterns

To add a new pattern classification:

### 1. Define the logic in `classify_pattern()` in `backend/analytics.py`

```python
# Example: "explosive" pattern
if heat > 3.0 and spike < 2.0 and sus > 10:
    return "explosive"
```

### 2. Add color/styling in `frontend/src/components/CoinTable.jsx`

```js
const PAT_META = {
  // ... existing patterns ...
  explosive: { color: 'var(--purple)', bg: 'var(--purple-dim)' },
}
```

### 3. Add to the filter list

```js
const PATTERNS = ['all', 'surging', 'ongoing', 'building', 'explosive', 'spiking', 'fading', 'flat']
```

### 4. Add description in `frontend/src/constants/metrics.js`

```js
export const PATTERN_DESCRIPTIONS = {
  // ... existing patterns ...
  explosive: 'Extreme volatility surge with sustained follow-through. RARE EVENT - highest conviction trades.',
}
```

### 5. Document in `METRICS.md`

Add a full section with:
- What it means
- Characteristics (thresholds)
- Trading signal
- Example

---

## Testing Your Changes

### Backend Tests

```bash
cd backend
python3 -m pytest  # (if you add pytest later)

# Manual test: Check syntax
python3 -m py_compile main.py analytics.py binance.py

# Manual test: Start server and hit endpoints
uvicorn main:app --reload
curl http://localhost:8000/api/health
curl http://localhost:8000/api/info
```

### Frontend Tests

```bash
cd frontend
npm run build  # Make sure it builds without errors

# Manual test: Check for console errors
npm run dev
# Open http://localhost:5173 and check browser console
```

### Full Integration Test

1. Start both backend and frontend
2. Click "Run Full Scan"
3. Verify:
   - Progress bar updates correctly
   - Results appear after scan completes
   - Sorting works for all columns
   - Pattern filters work
   - Tooltips appear on hover
   - Search box filters correctly
   - No console errors

---

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows style guidelines (PEP 8 / ESLint)
- [ ] All syntax checks pass (Python compiles, Vite builds)
- [ ] Documentation updated (README.md, METRICS.md if applicable)
- [ ] Tooltips updated for new metrics/patterns
- [ ] No `console.log` or debug code left in
- [ ] No hardcoded secrets or API keys (run `./scripts/check-secrets.sh` to verify)
- [ ] Tested locally (both backend and frontend)

#### Secret Scanning

Before committing, run the secrets check script:

```bash
./scripts/check-secrets.sh
```

This will scan your changes for:
- API keys or secrets
- Hardcoded passwords or tokens
- `.env` files (should never be committed)
- Suspicious long alphanumeric strings

You can also set this up as a pre-commit hook:

```bash
# Create git hooks directory if it doesn't exist
mkdir -p .git/hooks

# Link the script as a pre-commit hook
ln -s ../../scripts/check-secrets.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Now the check will run automatically before each commit!

### PR Template

```markdown
## What does this PR do?
Brief description of changes.

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
How did you test this? Screenshots if applicable.

## Related Issues
Closes #123
```

### Review Process

1. Automated checks (if CI is set up) must pass
2. Maintainer will review within 3-7 days
3. Address any requested changes
4. Once approved, PR will be merged

---

## Issue Guidelines

### Bug Reports

Include:
- **Description** — What happened vs what should happen
- **Steps to reproduce** — Exact steps to trigger the bug
- **Environment** — OS, Python version, Node version
- **Screenshots** — If applicable
- **Logs** — Backend console output or browser console errors

**Example:**
```markdown
## Bug: Heat metric shows NaN for some coins

**Expected:** Heat should always be a number
**Actual:** Some coins show NaN

**Steps to reproduce:**
1. Run full scan
2. Look for coins with pattern "flat"
3. Some have heat = NaN

**Environment:**
- OS: macOS 14.2
- Python: 3.11.6
- Node: 20.10.0

**Screenshot:** [attach image]

**Console error:**
```
TypeError: Cannot divide by zero in analytics.py:94
```
```

### Feature Requests

Include:
- **Problem statement** — What problem does this solve?
- **Proposed solution** — How would it work?
- **Alternatives considered** — Any other approaches?
- **Use case** — When would you use this feature?

---

## Code of Conduct

- Be respectful and constructive
- No harassment, discrimination, or trolling
- Focus on the code/ideas, not the person
- Assume good intent
- Disagreements are fine — argue the point, not the person

Violations will result in warnings or bans at maintainer discretion.

---

## Questions?

- **General questions** — GitHub Discussions
- **Bug reports** — GitHub Issues
- **Feature requests** — GitHub Issues
- **Security issues** — Email (add your email here if needed)

---

Thank you for contributing! 🚀
