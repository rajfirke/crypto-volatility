# Setup Guide

Complete setup instructions for the Crypto Volatility Scanner.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration (Optional)](#configuration-optional)
4. [Running the Application](#running-the-application)
5. [Development Setup](#development-setup)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Python 3.11+** ([Download](https://www.python.org/downloads/))
  ```bash
  python3 --version  # Should show 3.11 or higher
  ```

- **Node.js 18+** and npm ([Download](https://nodejs.org/))
  ```bash
  node --version  # Should show 18.x or higher
  npm --version
  ```

- **Git** (optional, for cloning)
  ```bash
  git --version
  ```

### System Requirements

- **OS:** macOS, Linux, or Windows (WSL recommended for Windows)
- **RAM:** 2GB minimum, 4GB recommended
- **Network:** Stable internet connection for Binance API calls

---

## Installation

### Option 1: Clone from GitHub

```bash
git clone https://github.com/YOUR_USERNAME/crypto-volatility.git
cd crypto-volatility
```

### Option 2: Download ZIP

1. Download the latest release from GitHub
2. Extract the ZIP file
3. Navigate to the extracted directory

---

## Configuration (Optional)

> **Note:** No configuration is required for basic usage. The scanner works out of the box with Binance public endpoints.

### Backend Configuration

If you want to customize settings:

```bash
cd backend
cp .env.example .env
nano .env  # or use your preferred editor
```

Available options (all optional):
- `PORT` — Backend server port (default: 8000)
- `BATCH_SIZE` — Number of coins to fetch per batch (default: 50)
- `BATCH_DELAY` — Delay between batches in seconds (default: 0.15)
- `MIN_VOLUME_USDT` — Minimum 24h volume filter (default: 100000)
- `KLINE_INTERVAL` — Candle interval (default: 1m)

### Frontend Configuration

```bash
cd frontend
cp .env.example .env
nano .env
```

Available options (all optional):
- `VITE_AUTO_REFRESH_SECONDS` — Auto-refresh interval (default: 60)
- `VITE_API_BASE_URL` — Backend URL for production deployment

---

## Running the Application

### Step 1: Install Backend Dependencies

```bash
cd backend

# Create a virtual environment (recommended)
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Start Backend Server

```bash
# Make sure you're in the backend directory with venv activated
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

**Leave this terminal running.**

### Step 3: Install Frontend Dependencies

Open a **new terminal window**:

```bash
cd frontend
npm install
```

### Step 4: Start Frontend Development Server

```bash
# Make sure you're in the frontend directory
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 5: Open in Browser

Open **http://localhost:5173** in your browser.

You should see the Crypto Volatility Scanner interface. Click "Run Full Scan" to start!

---

## Development Setup

### Backend Development

```bash
cd backend
source venv/bin/activate

# Run with auto-reload (for development)
uvicorn main:app --reload --port 8000

# Run with custom host (accessible from network)
uvicorn main:app --host 0.0.0.0 --port 8000

# Enable debug mode
uvicorn main:app --reload --log-level debug
```

### Frontend Development

```bash
cd frontend

# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Git Pre-Commit Hook (Optional)

Set up automatic secret scanning before each commit:

```bash
# From project root
./scripts/check-secrets.sh  # Test the script first

# Install as pre-commit hook
mkdir -p .git/hooks
ln -s ../../scripts/check-secrets.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

Now the secrets check will run automatically before every commit!

---

## Deployment

### Production Build

#### Backend

```bash
cd backend
source venv/bin/activate

# Install production dependencies
pip install -r requirements.txt

# Run with gunicorn (production WSGI server)
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

#### Frontend

```bash
cd frontend

# Build for production
npm run build

# Output will be in frontend/dist/
# Serve with any static file server (nginx, Caddy, etc.)
```

### Deployment Options

#### Option 1: Traditional VPS (DigitalOcean, Linode, AWS EC2)

1. Set up a server with Ubuntu 22.04+
2. Install Python 3.11+, Node.js 18+
3. Clone the repository
4. Follow installation steps above
5. Use nginx as reverse proxy
6. Set up SSL with Let's Encrypt
7. Use systemd to run backend as a service

#### Option 2: Docker (Recommended)

Create `Dockerfile` in project root:

```dockerfile
# Backend
FROM python:3.11-slim
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "8000:8000"
  
  frontend:
    image: nginx:alpine
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
    ports:
      - "80:80"
```

#### Option 3: Platform-as-a-Service

- **Backend:** Railway, Render, Fly.io, Heroku
- **Frontend:** Vercel, Netlify, Cloudflare Pages

### Environment Variables for Production

Set these in your deployment platform:

```bash
# Backend
PORT=8000
DEBUG=false
CORS_ORIGINS=https://yourdomain.com

# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## Troubleshooting

### Backend Issues

#### "Module not found" errors

```bash
# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Reinstall dependencies
pip install -r requirements.txt
```

#### "Address already in use" (port 8000)

```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or use a different port
uvicorn main:app --reload --port 8001
```

#### "Cannot connect to Binance API"

- Check your internet connection
- Verify you're not behind a firewall blocking Binance
- Check if Binance is down: https://status.binance.com/
- Try a VPN if Binance is restricted in your region

#### Rate limit errors (429)

The code has built-in rate limiting, but if you see 429 errors:
- Increase `BATCH_DELAY` in `.env` (try 0.3 instead of 0.15)
- Reduce `BATCH_SIZE` (try 25 instead of 50)
- Wait 1 minute for rate limit to reset

### Frontend Issues

#### "Cannot reach backend" error

1. Verify backend is running on port 8000:
   ```bash
   curl http://localhost:8000/api/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. Check `vite.config.js` proxy settings:
   ```js
   proxy: {
     '/api': 'http://localhost:8000'
   }
   ```

3. Check CORS settings in `backend/main.py`:
   ```python
   allow_origins=["http://localhost:5173", "http://localhost:4173"]
   ```

#### Blank page or build errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite

# Rebuild
npm run build
```

#### Port 5173 already in use

```bash
# Use a different port
npm run dev -- --port 5174
```

### Data Issues

#### No coins showing up

- Check minimum volume filter (default: $100k 24h volume)
- Lower `MIN_VOLUME_USDT` in backend `.env` if needed
- Verify Binance API is returning data:
  ```bash
  curl http://localhost:8000/api/info
  ```

#### Metrics show NaN or weird values

- This can happen with very low-volume coins
- The code filters these out, but check `analytics.py` for edge cases
- Report as a bug if it happens frequently

### Performance Issues

#### Scan takes too long (>30 seconds)

- Increase `BATCH_SIZE` (try 100 instead of 50)
- Decrease `BATCH_DELAY` (try 0.1 instead of 0.15)
- Note: This may increase risk of hitting rate limits

#### High memory usage

- Reduce number of pairs scanned (increase `MIN_VOLUME_USDT`)
- Reduce `KLINE_LIMIT` (affects analytics accuracy)

---

## Getting Help

- **GitHub Issues:** Report bugs or request features
- **GitHub Discussions:** Ask questions or share ideas
- **Documentation:** Check README.md, METRICS.md, SECURITY.md

---

**Happy scanning!** 📈
