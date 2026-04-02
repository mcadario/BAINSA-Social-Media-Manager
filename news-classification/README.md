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
``` bash
bash setup.sh
```
## Usage
```bash
python top_n_news.py
```

This generates `output/top_articles.md` with the top 5 most interesting AI articles.

## Configuration

| Constant | File | Description |
|---|---|---|
| `TOP_N` | `top_n_news.py` | Number of top articles |
| `LIMIT` | `top_n_news.py` | Limit Articles to fetch from API |
| `KEYWORDS` | `top_n_news.py` | Search keywords |
| `EXCLUDE_CAT` | `top_n_news.py` | Categories to exclude |