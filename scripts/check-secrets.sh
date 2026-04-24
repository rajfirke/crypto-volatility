#!/bin/bash
# check-secrets.sh
# Pre-commit hook to detect potential secrets in files

echo "🔍 Checking for potential secrets..."

# Check for common secret patterns
SECRETS_FOUND=0

# Patterns to search for
PATTERNS=(
  "api[_-]?key[[:space:]]*[:=]"
  "api[_-]?secret[[:space:]]*[:=]"
  "password[[:space:]]*[:=]"
  "token[[:space:]]*[:=]"
  "BINANCE_API_KEY"
  "BINANCE_API_SECRET"
  "bearer[[:space:]]*[a-zA-Z0-9]+"
)

# Determine if we're in a git repo and get files to check
if git rev-parse --git-dir > /dev/null 2>&1; then
  # Git mode: check staged files
  FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | \
    grep -v "node_modules/" | \
    grep -v "venv/" | \
    grep -v "__pycache__/" | \
    grep -v ".pyc$" | \
    grep -v ".env.example$" | \
    grep -v "check-secrets.sh$" | \
    grep -v "SECURITY.md$" || true)

  if [ -z "$FILES" ]; then
    echo "✅ No staged files to check"
    exit 0
  fi
  MODE="git"
else
  # Manual mode: check all source files
  echo "ℹ️  Not a git repository - checking all source files"
  FILES=$(find . -type f \( -name "*.py" -o -name "*.js" -o -name "*.jsx" -o -name "*.env" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/venv/*" \
    -not -path "*/__pycache__/*" \
    -not -name "*.env.example" \
    -not -name "check-secrets.sh" 2>/dev/null || true)

  if [ -z "$FILES" ]; then
    echo "✅ No files to check"
    exit 0
  fi
  MODE="manual"
fi

echo "Checking $(echo "$FILES" | wc -l | tr -d ' ') files..."

# Check each file for patterns
for PATTERN in "${PATTERNS[@]}"; do
  if [ "$MODE" = "git" ]; then
    MATCHES=$(echo "$FILES" | xargs grep -inE "$PATTERN" 2>/dev/null || true)
  else
    MATCHES=$(echo "$FILES" | xargs grep -inE "$PATTERN" 2>/dev/null || true)
  fi

  if [ ! -z "$MATCHES" ]; then
    echo "⚠️  Warning: Potential secret found matching pattern: $PATTERN"
    echo "$MATCHES"
    SECRETS_FOUND=1
  fi
done

# Check if .env files are being committed (should never happen)
ENV_FILES=$(echo "$FILES" | grep "\.env$" | grep -v ".env.example$" || true)
if [ ! -z "$ENV_FILES" ]; then
  echo "❌ ERROR: Found .env file(s):"
  echo "$ENV_FILES"
  echo ""
  if [ "$MODE" = "git" ]; then
    echo "These files should NOT be committed! Add them to .gitignore."
  else
    echo "These files should NOT contain secrets in a shared repository!"
  fi
  SECRETS_FOUND=1
fi

# Check if any API keys look like real values (not placeholders)
REAL_KEYS=$(echo "$FILES" | xargs grep -inE "['\"][a-zA-Z0-9]{32,}['\"]" 2>/dev/null | \
  grep -vE "example|placeholder|your_|test_|fake_|demo_|xxx|000|node_modules|venv" || true)

if [ ! -z "$REAL_KEYS" ]; then
  echo "⚠️  Warning: Potential real API key found (long alphanumeric string):"
  echo "$REAL_KEYS"
  SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 1 ]; then
  echo ""
  if [ "$MODE" = "git" ]; then
    echo "❌ Commit blocked - potential secrets detected!"
    echo "Please review the warnings above and:"
    echo "  1. Remove hardcoded secrets from code"
    echo "  2. Move secrets to .env files"
    echo "  3. Ensure .env is in .gitignore (already done)"
    echo ""
    echo "To bypass this check (not recommended):"
    echo "  git commit --no-verify"
  else
    echo "⚠️  Warnings detected!"
    echo "Please review the warnings above before sharing this code."
  fi
  exit 1
fi

echo "✅ No secrets detected - safe to proceed"
exit 0
