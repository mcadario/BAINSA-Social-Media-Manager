from pathlib import Path
import json
import os
import sys
from datetime import datetime
import subprocess
from getpass import getpass

import requests

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent.parent

BRAND_MEMORY_PATH = PROJECT_DIR / "bainsa_pipeline" / "step1" / "brand_memory_final.md"
RESEARCH_INPUT_PATH = PROJECT_DIR / "bainsa_pipeline" / "agent_a" / "output" / "top_articles.md"
PROMPT_PATH = BASE_DIR / "agent_b_prompt.md"
ENV_PATH = BASE_DIR / ".env"

OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
OUTPUT_PATH = OUTPUT_DIR / f"agent_b_story_output_{timestamp}.json"


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def read_file(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    return path.read_text(encoding="utf-8")


def build_prompt(brand_memory: str, research_input: str, agent_prompt: str) -> str:
    return f"""
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
Do not use markdown fences.
Your entire response must start with {{ and end with }}.
""".strip()


def extract_json_block(text: str) -> str:
    text = text.strip()

    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            text = "\n".join(lines[1:-1]).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Could not find JSON object in model response.")

    return text[start:end + 1]

def ensure_gemini_api_key(env_path: Path) -> str:
    existing_key = None

    if env_path.exists():
        load_env_file(env_path)
        existing_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if existing_key:
        use_existing = input("Use saved Gemini API key from .env? [Y/n]: ").strip().lower()
        if use_existing in {"", "y", "yes"}:
            return existing_key

    api_key = getpass("Paste your Gemini API key: ").strip()
    if not api_key:
        raise RuntimeError("No API key provided.")

    env_path.write_text(f"GEMINI_API_KEY={api_key}\n", encoding="utf-8")
    os.environ["GEMINI_API_KEY"] = api_key
    return api_key

def main() -> None:
    api_key = ensure_gemini_api_key(ENV_PATH)
    brand_memory = read_file(BRAND_MEMORY_PATH)
    research_input = read_file(RESEARCH_INPUT_PATH)
    agent_prompt = read_file(PROMPT_PATH)

    prompt = build_prompt(
        brand_memory=brand_memory,
        research_input=research_input,
        agent_prompt=agent_prompt,
    )

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": api_key,
    }
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 5000,
            "responseMimeType": "application/json",
            "responseJsonSchema": {
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
                                "slide_number",
                                "hook",
                                "body",
                                "cta",
                                "visual_direction",
                                "source_topic_headline",
                            ],
                        }
                    }
                        },
                        "required": ["slides"]
                        
                        }
        }
    }

    response = requests.post(url, headers=headers, json=payload, timeout=120)
    response.raise_for_status()
    data = response.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        raise RuntimeError(f"Unexpected API response: {e}\n{json.dumps(data, indent=2)}")

    json_text = extract_json_block(text)
    parsed = json.loads(json_text)

    OUTPUT_PATH.write_text(json.dumps(parsed, indent=2), encoding="utf-8")
    print(f"Saved story output to {OUTPUT_PATH}")
    result = subprocess.run(
        ["python3", str(BASE_DIR / "agent_b_validator.py")],
        capture_output=True,
        text=True
    )

    print(result.stdout)

    if result.returncode != 0:
        print(result.stderr)
        raise RuntimeError("Validator failed to run.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
