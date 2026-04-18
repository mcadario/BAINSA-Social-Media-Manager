# BAINSA Social Media Manager

An automated pipeline that fetches, ranks, and transforms daily AI news into brand-compliant Instagram Story copy for BAINSA — Bocconi's Association in Neuroscience and Artificial Intelligence.

The system runs in three stages: brand memory extraction → news research → story generation, with a local web dashboard for human review and control.

---

## How it works

```
Brand Guidelines PDF
        │
        ▼
  Step 1: Brand Memory          (one-time setup, already done)
  bainsa_pipeline/step1/
  └── brand_memory_final.md    ← structured brand rules
        │
        ▼
  Agent A: News Research        (run daily or on demand)
  bainsa_pipeline/agent_a/
  └── top_n_news.py            ← fetches + ranks top AI articles
        │
        ▼
  agent_a/output/top_articles.md
        │
        ▼
  Agent B: Story Generator      (triggered via dashboard or CLI)
  bainsa_pipeline/agent_b/
  └── agent_b_runner.py        ← calls Gemini, outputs story JSON
        │
        ▼
  agent_b/outputs/*.json        ← timestamped story drafts
        │
        ▼
  Dashboard                     (local web UI for review)
  dashboard/
  └── Human review, edit, brand compliance check
```

---

## Prerequisites

- [Miniconda](https://docs.conda.io/en/latest/miniconda.html) or Anaconda
- [Node.js](https://nodejs.org/) v18 or later (for the dashboard)
- A [Gemini API key](https://aistudio.google.com/) (free tier works)
- A [Newsdata.io API key](https://newsdata.io/) (free tier works)

---

## First-time setup

### 1. Clone the repo and enter the project

```bash
git clone <your-repo-url>
cd BAINSA-Social-Media-Manager
```

### 2. Create the Python environment

This creates a `bainsa` conda environment and installs all dependencies:

```bash
bash setup_env.sh
```

This will:
- Create a conda env called `bainsa` with Python 3.11
- Install all pip packages (requests, newspaper3k, scikit-learn, transformers, etc.)
- Download required NLTK data
- Create a `.env` template if one doesn't exist yet

### 3. Add your API keys

Edit the `.env` file at the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
NEWSDATA_API_KEY=your_newsdata_api_key_here
```

### 4. Install dashboard dependencies

```bash
cd dashboard
npm install
cd ..
```

---

## Running the pipeline

### Step 1 — Run Agent A (fetch today's news)

Agent A pulls the latest AI news, scores articles by relevance using a trained classifier, and writes the top results to a markdown research handoff.

```bash
conda activate bainsa
cd bainsa_pipeline/agent_a
python top_n_news.py
```

Output: `bainsa_pipeline/agent_a/output/top_articles.md`

This file is the research input for Agent B.

### Step 2 — Run Agent B via the Dashboard (recommended)

Start the dashboard:

```bash
cd dashboard
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

From the dashboard you can:
- **Run Agent** — triggers the full Agent B pipeline (reads brand memory + research input, calls Gemini, saves output, validates)
- **Mock Run** — simulates a run using the most recent existing output, no API key needed (useful for testing the dashboard itself)
- **Stop** — cancels a running pipeline at any point
- View real-time log output as the pipeline runs
- Browse all past outputs in the Story Preview panel
- Preview each slide as a 9:16 Instagram Story card
- Edit hook, body, and CTA directly in the dashboard
- Check brand compliance for each slide

### Step 2 (alternative) — Run Agent B from the CLI

```bash
conda activate bainsa
cd bainsa_pipeline/agent_b
python agent_b_runner.py
```

This runs interactively in the terminal. Outputs are saved to `bainsa_pipeline/agent_b/outputs/`.

---

## Using the Dashboard

### Agent Control Panel (left column)

| Button | What it does |
|---|---|
| **Run Agent** | Starts the real pipeline — requires API keys in `.env` |
| **Mock Run** | Replays logs and loads the latest existing output — no API key needed |
| **Stop** | Cancels the current run immediately |

The log panel streams live output from the Python process so you can see exactly what's happening at each step.

### Story Preview (right column)

- **File list** — all past runs sorted by date, most recent first
- **Slide tabs** — switch between slide 1 and slide 2
- **9:16 preview card** — shows the story as it would appear on Instagram, with the correct accent colour and brand corner elements
- **Edit Content toggle** — flip to edit mode to modify hook, body, or CTA directly; flip back to discard changes
- **Brand Compliance panel** — checks three rules automatically:
  - CTA is concise (≤ 8 words)
  - Visual direction references a brand accent colour (blue, orange, or pink)
  - Layout is described as minimalistic

---

## Project structure

```
BAINSA-Social-Media-Manager/
├── .env                              # API keys (never committed)
├── .env.example                      # Template showing required keys
├── setup_env.sh                      # One-shot environment setup script
├── environment.yml                   # Conda env spec (Python 3.11 + pip)
│
├── bainsa_pipeline/
│   ├── step1/                        # Brand memory (one-time extraction)
│   │   ├── brand_memory_final.md     # Structured brand rules used by Agent B
│   │   └── brand_memory_schema.md    # Schema definition for the brand memory
│   │
│   ├── agent_a/                      # News research agent
│   │   ├── top_n_news.py             # Main script — fetches and ranks news
│   │   ├── imports/                  # Pipeline modules (news fetch, classifier)
│   │   ├── datasets/                 # Trained classifier data
│   │   └── output/
│   │       └── top_articles.md       # Research handoff for Agent B
│   │
│   ├── agent_b/                      # Story generation agent
│   │   ├── agent_b_runner.py         # Interactive CLI runner
│   │   ├── agent_b_prompt.md         # System prompt sent to Gemini
│   │   ├── agent_b_validator.py      # Brand compliance validator
│   │   └── outputs/                  # Timestamped JSON story drafts
│   │       └── agent_b_story_output_YYYYMMDD_HHMMSS.json
│   │
│   └── gateway/
│       └── run_agent_b.py            # Non-interactive runner used by the dashboard
│
└── dashboard/                        # Next.js web dashboard
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx              # Main dashboard page
    │   │   └── api/
    │   │       ├── run-agent/        # POST to start, DELETE to stop
    │   │       ├── logs/             # SSE stream for real-time log output
    │   │       ├── outputs/          # List all output files
    │   │       └── output/[filename] # Fetch a specific output file
    │   ├── components/
    │   │   ├── AgentControlPanel.tsx # Run/Stop buttons + log viewer
    │   │   ├── LogViewer.tsx         # Real-time SSE log display
    │   │   ├── OutputGallery.tsx     # File list + preview + editor
    │   │   └── InstagramPreview.tsx  # 9:16 story card renderer
    │   └── lib/
    │       ├── agentState.ts         # Shared server state (process, logs, status)
    │       ├── paths.ts              # Resolved file paths
    │       ├── types.ts              # Shared TypeScript types
    │       └── parseVisualDirection.ts  # Extracts accent colour from visual_direction
    └── .env.local.example            # Dashboard env template (optional overrides)
```

---

## Output format

Each Agent B run produces a JSON file like:

```json
{
  "slides": [
    {
      "slide_number": 1,
      "hook": "AI agents are multiplying — but they can't talk to each other",
      "body": "DARPA is funding research into agent communication standards. Right now, agents built by different teams can't interoperate — a fundamental gap that limits real-world deployment.",
      "cta": "Swipe to see who's solving it →",
      "visual_direction": "Minimalistic layout. Black background, white text. Left-aligned body. A subtle blue corner element.",
      "source_topic_headline": "DARPA Wants AI Agents to Talk to Each Other — and Nobody Has Figured Out How Yet"
    }
  ]
}
```

Files are saved to `bainsa_pipeline/agent_b/outputs/` and named `agent_b_story_output_YYYYMMDD_HHMMSS.json`.

---

## Configuration

**Agent A** (`bainsa_pipeline/agent_a/top_n_news.py`):

| Constant | Default | Description |
|---|---|---|
| `TOP_N` | `5` | Number of top articles to include in the research handoff |
| `LIMIT` | `50` | Number of articles to fetch from the Newsdata API |
| `KEYWORDS` | `"ai, artificial intelligence, ..."` | Search terms |
| `EXCLUDE_CAT` | `"business"` | News categories to exclude |

**Agent B** (`bainsa_pipeline/agent_b/agent_b_prompt.md`):

The prompt is a plain markdown file — edit it directly to change how stories are written. It controls hook style, CTA rules, visual direction, and filtering behaviour.

---

## API keys

Both keys go in `.env` at the project root. This file is gitignored and never committed.

| Key | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) — free tier available |
| `NEWSDATA_API_KEY` | [newsdata.io](https://newsdata.io) — free tier available |

If you need to rotate a key, update `.env` and restart any running dashboard or Python process.

---

## Daily workflow

Once set up, the typical flow is:

```bash
# 1. Activate the environment
conda activate bainsa

# 2. Run Agent A to fetch today's news
cd bainsa_pipeline/agent_a && python top_n_news.py && cd ../..

# 3. Open the dashboard
cd dashboard && npm run dev

# 4. Go to http://localhost:3000
#    → click Run Agent
#    → review the story previews
#    → edit if needed
#    → use the output for your Instagram post
```
