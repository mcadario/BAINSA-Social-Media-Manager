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
git clone https://github.com/mcadario/BAINSA-Social-Media-Manager.git
cd BAINSA-Social-Media-Manager
```

### 2. Run the setup script

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

---

## Running using docker (preferred method)

### Step 1 - Project Setup

Position yourself in the project folder and run the setup script:
```bash
cd /BAINSA-Social-Media-Manager
bash setup_env.sh
```
Then in your [.env] file insert the API keys.

### Step 2 - Docker Installation and Setup (only 1st time)
(Here dnf is used for Fedora-based systems, use your preferred package manager).
```bash
sudo dnf -y install dnf-plugins-core
sudo dnf-3 config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```
Test it with
```bash
docker run hello-world
```

Position yourslef in the project folder, then build:
```bash
docker compose build
```

### Step 3 - Connecting to the dashboard (daily use)

And finally run it:
```bash
docker compose up -d
```
NOTE: -d is to detach, so that logs will not displayed. To display logs run:
```bash
docker compose logs -f
```

Now you can connect to the container, throught the link [http://localhost:3000] in your browser, and click Run Agent B. 

CLICK REFRESH IN THE "STORY PREVIEW" SECTION IF NOTHING APPEARS.

NOTE:
```bash
docker compose down
```
to shut it down.


---

## Running the pipeline (manually)

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
| **Generate** | Starts the real pipeline — requires API keys in `.env` |
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
├── bainsa_pipeline
│   ├── agent_a
│   │   ├── articles_chkpt.json
│   │   ├── datasets
│   │   ├── imports
│   │   ├── output
│   │   ├── setup.sh
│   │   ├── top_n_news.py
│   │   └── train_regressor.ipynb
│   ├── agent_b
│   │   ├── agent_b_prompt.md
│   │   ├── agent_b_runner.py
│   │   ├── agent_b_validator.py
│   │   └── outputs
│   ├── gateway
│   │   └── run_agent_b.py
│   └── step1
│       ├── brand_memory_final.md
│       ├── brand_memory_schema.md
│       ├── extraction_plan.md
│       ├── openclaw_step1_prompt.md
│       ├── (Step1)brand_format.md
│       ├── test_extraction_notes.md
│       └── visual_extraction_notes.md
├── dashboard
│   ├── next.config.mjs
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.mjs
│   ├── public
│   │   └── fonts
│   ├── src
│   │   ├── app
│   │   ├── components
│   │   └── lib
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── docker-compose.yml
├── Dockerfile
├── environment.yml
├── LICENSE
├── README.md
├── requirements.txt
├── setup_env.sh
├── slide-examples
│   ├── bainsa_slide_1_20260505_065909.png
│   ├── bainsa_slide_1_20260505_071000.png
│   ├── bainsa_slide_2_20260505_065909.png
│   └── bainsa_slide_2_20260505_071000.png
└── (Step1)brand_format.md
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
| `LIMIT` | `50` | Maximum number of articles to fetch from the Newsdata API |
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

#### Docker Usage (preferred)

```bash
docker compose up -d
```
NOTE: -d is to detach, so that logs will not displayed. To display logs run:
```bash
docker compose logs -f
```

Now you can connect to the container, throught the link [http://localhost:3000] in your browser, and click Run Agent B. 

CLICK REFRESH IN THE "STORY PREVIEW" SECTION IF NOTHING APPEARS.

NOTE:
```bash
docker compose down
```
to shut it down.

#### Manual Pipeline

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
