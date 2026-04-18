#!/usr/bin/env python3
"""
Non-interactive Agent B runner for the BAINSA Dashboard.

This script wraps the core agent_b logic without interactive prompts,
reading the GEMINI_API_KEY directly from the project .env file.
Designed to be spawned by the Next.js dashboard as a child process.
"""
import os
import sys
import json
import subprocess
import requests
from pathlib import Path
from datetime import datetime


# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------
GATEWAY_DIR = Path(__file__).resolve().parent
PROJECT_DIR = GATEWAY_DIR.parent.parent          # {project_root}/
AGENT_B_DIR = PROJECT_DIR / "bainsa_pipeline" / "agent_b"
OUTPUTS_DIR = AGENT_B_DIR / "outputs"
BRAND_MEMORY_PATH = PROJECT_DIR / "bainsa_pipeline" / "step1" / "brand_memory_final.md"
RESEARCH_INPUT_PATH = PROJECT_DIR / "bainsa_pipeline" / "agent_a" / "output" / "top_articles.md"
PROMPT_PATH = AGENT_B_DIR / "agent_b_prompt.md"
ENV_PATH = PROJECT_DIR / ".env"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def log(msg: str, level: str = "INFO") -> None:
    """Flush a timestamped log line so the Node.js parent can stream it."""
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level}] {msg}", flush=True)


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def read_file(path: Path, label: str) -> str:
    if not path.exists():
        log(f"Missing required file: {path}", "ERROR")
        sys.exit(1)
    log(f"Loaded {label}")
    return path.read_text(encoding="utf-8")


def extract_json_block(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            text = "\n".join(lines[1:-1]).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Could not find a JSON object in the model response.")
    return text[start : end + 1]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    log("BAINSA Agent B pipeline starting…")

    # 1 — Load API key
    load_env(ENV_PATH)
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        log(
            "GEMINI_API_KEY not found. Add it to the project .env file and restart.",
            "ERROR",
        )
        sys.exit(1)
    log("API key loaded ✓")

    # 2 — Read inputs
    log("Reading brand memory…")
    brand_memory = read_file(BRAND_MEMORY_PATH, "brand_memory_final.md")

    log("Reading research input…")
    research_input = read_file(RESEARCH_INPUT_PATH, "top_articles.md")

    log("Reading agent prompt…")
    agent_prompt = read_file(PROMPT_PATH, "agent_b_prompt.md")

    # 3 — Build prompt
    log("Building prompt…")
    prompt = f"""
{agent_prompt}

====================
BRAND MEMORY
====================
{brand_memory}

====================
RESEARCH INPUT
====================
{research_input}

====================
OUTPUT REQUIREMENTS
====================
Return exactly one valid JSON object.
Do not include any introduction.
Do not include any explanation.
Do not include markdown fences.
Do not include notes before or after the JSON.
Top-level key must be "slides".
Do not use "stories".
Your entire response must start with {{ and end with }}.
""".strip()

    # 4 — Call Gemini
    import time

    # Model preference order — all confirmed available for this API key.
    # 429 = rate-limited (retry same model with backoff).
    # 404 = model name wrong (skip to next).
    # 500/503 = transient (retry briefly, then move on).
    MODELS = [
        "gemini-2.5-flash",       # Latest, confirmed available
        "gemini-2.0-flash",       # Stable fallback
        "gemini-2.0-flash-lite",  # Lighter fallback
        "gemini-flash-latest",    # Alias fallback
    ]

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": api_key,
    }

    # Base payload — with structured JSON output
    def build_payload(use_schema: bool) -> dict:
        gen_config: dict = {
            "temperature": 0.1,
            "maxOutputTokens": 5000,
        }
        if use_schema:
            gen_config["responseMimeType"] = "application/json"
            gen_config["responseJsonSchema"] = {
                "type": "object",
                "properties": {
                    "slides": {
                        "type": "array",
                        "minItems": 1,
                        "maxItems": 3,
                        "items": {
                            "type": "object",
                            "properties": {
                                "slide_number": {"type": "integer"},
                                "hook": {"type": "string"},
                                "body": {"type": "string"},
                                "cta": {"type": "string"},
                                "visual_direction": {"type": "string"},
                                "source_topic_headline": {"type": "string"},
                            },
                            "required": [
                                "slide_number", "hook", "body",
                                "cta", "visual_direction", "source_topic_headline",
                            ],
                        },
                    }
                },
                "required": ["slides"],
            }
        return {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": gen_config}

    data = None
    last_error = ""

    for model in MODELS:
        url = BASE_URL.format(model=model)

        # Try with JSON schema first, then without (some model tiers don't support it)
        for use_schema in (True, False):
            payload = build_payload(use_schema)
            schema_label = "with schema" if use_schema else "plain text"
            log(f"Calling Gemini [{model}] ({schema_label})…")

            # Retry budget per (model, schema) combination:
            #   429  → retry up to 3× with backoff (rate limit, model is fine)
            #   5xx  → retry once with a 3 s wait, then skip (transient overload)
            #   404  → skip immediately (wrong model name, no point retrying)
            #   other→ skip immediately
            MAX_RATE_LIMIT_RETRIES = 3
            rate_limit_attempts = 0
            server_error_retried = False

            while True:
                try:
                    response = requests.post(url, headers=headers, json=payload, timeout=120)
                    status = response.status_code

                    if status == 200:
                        data = response.json()
                        log(f"Gemini response received ✓  (model: {model}, {schema_label})")
                        break  # success

                    elif status == 429:
                        rate_limit_attempts += 1
                        if rate_limit_attempts > MAX_RATE_LIMIT_RETRIES:
                            last_error = f"429 rate limit on {model} — giving up after {MAX_RATE_LIMIT_RETRIES} retries"
                            log(last_error, "WARN")
                            break
                        wait = 10 * rate_limit_attempts
                        log(f"Rate limited (429) on {model} — waiting {wait}s (attempt {rate_limit_attempts}/{MAX_RATE_LIMIT_RETRIES})…", "WARN")
                        time.sleep(wait)
                        continue

                    elif status in (500, 502, 503, 504):
                        if not server_error_retried:
                            server_error_retried = True
                            log(f"Server error ({status}) on {model} — retrying once in 3 s…", "WARN")
                            time.sleep(3)
                            continue
                        last_error = f"{status} from {model} after retry — skipping"
                        log(last_error, "WARN")
                        break  # skip to next model/schema

                    elif status == 404:
                        last_error = f"404 — model '{model}' not available for this key"
                        log(last_error, "WARN")
                        break

                    else:
                        last_error = f"HTTP {status} from {model}: {response.text[:300]}"
                        log(last_error, "WARN")
                        break

                except requests.Timeout:
                    last_error = f"Timeout waiting for {model}"
                    log(last_error, "WARN")
                    break

                except Exception as e:
                    last_error = f"Error calling {model}: {e}"
                    log(last_error, "WARN")
                    break

            if data is not None:
                break  # got a response — exit schema loop

        if data is not None:
            break  # got a response — exit model loop

    if data is None:
        log(f"All models failed. Last error: {last_error}", "ERROR")
        sys.exit(1)

    # 5 — Parse response
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        log(f"Unexpected API response structure: {e}", "ERROR")
        sys.exit(1)

    try:
        json_text = extract_json_block(text)
        parsed = json.loads(json_text)
    except (ValueError, json.JSONDecodeError) as e:
        log(f"JSON parse error: {e}", "ERROR")
        sys.exit(1)

    slide_count = len(parsed.get("slides", []))
    log(f"Parsed {slide_count} slide(s) ✓")

    # 6 — Save output
    OUTPUTS_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_filename = f"agent_b_story_output_{timestamp}.json"
    output_path = OUTPUTS_DIR / output_filename
    output_path.write_text(json.dumps(parsed, indent=2), encoding="utf-8")
    log(f"Output saved → {output_filename}")

    # 7 — Run validator
    log("Running brand validator…")
    result = subprocess.run(
        ["python3", str(AGENT_B_DIR / "agent_b_validator.py")],
        capture_output=True,
        text=True,
    )
    for line in result.stdout.splitlines():
        if line.strip():
            log(line.strip(), "VALIDATOR")
    if result.stderr:
        for line in result.stderr.splitlines():
            if line.strip():
                log(line.strip(), "WARN")

    if result.returncode != 0:
        log("Validator reported issues — check output manually.", "WARN")
    else:
        log("Validation passed ✓")

    log("Pipeline complete!")
    # Final marker line: the Next.js API route watches for this
    print(f"DASHBOARD_OUTPUT_FILE:{output_filename}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"Unhandled error: {e}", "ERROR")
        sys.exit(1)
