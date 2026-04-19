#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# BAINSA — one-shot environment setup
# Usage:
#   bash setup_env.sh          # first-time setup
#   bash setup_env.sh --update # re-run pip installs on an existing env
# ─────────────────────────────────────────────────────────────────────────────

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_NAME="bainsa"

# ── 0. Sanity check ──────────────────────────────────────────────────────────
if ! command -v conda &>/dev/null; then
  echo "❌  conda not found. Install Miniconda first:"
  echo "    https://docs.conda.io/en/latest/miniconda.html"
  exit 1
fi

# ── 1. Create conda env (Python only — pip does the rest) ────────────────────
if conda env list | grep -q "^${ENV_NAME} "; then
  echo "✅  Conda env '${ENV_NAME}' already exists."
else
  echo "📦  Creating conda env '${ENV_NAME}' with Python 3.11…"
  conda create -n "$ENV_NAME" python=3.11 -y
  echo "✅  Conda env created."
fi

# ── 2. Install all pip packages inside the env ───────────────────────────────
echo ""
echo "📥  Installing pip packages into '${ENV_NAME}'…"

# Resolve the pip binary inside the env
CONDA_BASE=$(conda info --base)
PIP="$CONDA_BASE/envs/$ENV_NAME/bin/pip"
PYTHON="$CONDA_BASE/envs/$ENV_NAME/bin/python"

$PIP install --quiet --upgrade pip
$PIP install -r requirements.txt

echo "✅  Pip packages installed."

# ── 3. Download NLTK data ────────────────────────────────────────────────────
echo ""
echo "📥  Downloading NLTK data…"
$PYTHON -c "
import nltk
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)
nltk.download('stopwords', quiet=True)
print('  NLTK data ready.')
"

# ── 4. Create output directory ───────────────────────────────────────────────
mkdir -p "$SCRIPT_DIR/bainsa_pipeline/agent_a/output"

# ── 5. Ensure .env exists ────────────────────────────────────────────────────
ENV_PATH="$SCRIPT_DIR/.env"
if [ ! -f "$ENV_PATH" ]; then
  echo ""
  echo "📝  Creating .env template…"
  cat > "$ENV_PATH" <<'EOF'
GEMINI_API_KEY=your_gemini_api_key_here
NEWSDATA_API_KEY=your_newsdata_api_key_here
EOF
  echo "    ⚠️  Edit .env and add your real API keys."
else
  echo "✅  .env already exists — skipping."
fi

# ── 6. Done ──────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
echo "  Setup complete!  Activate with:"
echo ""
echo "    conda activate ${ENV_NAME}"
echo ""
echo "  Then run agents:"
echo "    cd bainsa_pipeline/agent_a && python top_n_news.py"
echo "    cd bainsa_pipeline/agent_b && python agent_b_runner.py"
echo "    cd bainsa_pipeline/gateway && python run_agent_b.py"
echo ""
echo "  Dashboard:"
echo "    cd dashboard && npm run dev"
echo "════════════════════════════════════════════════════════"
