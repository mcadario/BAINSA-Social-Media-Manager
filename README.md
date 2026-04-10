# BAINSA OpenClaw Instagram Story Pipeline

## Overview
This project automates parts of the BAINSA Instagram Story workflow.

### Step 1
Extract brand rules from BAINSA brand documents into a structured brand memory file.

### Step 2
Fetch and rank daily AI news into a research handoff.

### Step 3
Use the research handoff and brand memory to generate brand-compliant Instagram Story copy automatically.

## Agent B

- reads `bainsa_pipeline/step1/brand_memory_final.md`
- reads `bainsa_pipeline/agent_a/output/top_articles.md`
- reads `step1/brand_memory_final.md`
- reads `agent_a/output/top_articles.md`
- generates Instagram Story JSON
- saves outputs to `bainsa_pipeline/agent_b/outputs/`
- validates the latest output automatically

Run it with:
```bash
cd bainsa_pipeline/agent_b
python3 agent_b_runner.py
```


This generates a timestamped JSON output in `agent_b/outputs/` and validates the latest result automatically.

For Agent B, create `bainsa_pipeline/agent_b/.env` and add:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Requirements
- Python 3.11
- Mamba/Conda or pip

## Setup

1. Create and activate environment:
```bash
mamba create -n newsdata python=3.11 pip
mamba activate newsdata
```

2. Run setup routine:
```bash
cd bainsa_pipeline/agent_a
bash setup.sh
```

After running `bash setup.sh`, edit `.env` and add your `NEWSDATA_API_KEY`.

## Usage
```bash
cd bainsa_pipeline/agent_a
python3 top_n_news.py
```

This generates `output/top_articles.md` with the top 5 most interesting AI articles.

## Configuration

| Constant | File | Description |
|---|---|---|
| `TOP_N` | `top_n_news.py` | Number of top articles |
| `LIMIT` | `top_n_news.py` | Limit Articles to fetch from API |
| `KEYWORDS` | `top_n_news.py` | Search keywords |
| `EXCLUDE_CAT` | `top_n_news.py` | Categories to exclude |

