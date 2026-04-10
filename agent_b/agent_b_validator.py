from pathlib import Path
import json
import re

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

OUTPUTS_DIR = BASE_DIR / "outputs"
RESEARCH_INPUT_PATH = PROJECT_DIR / "agent_a" / "output" / "top_articles.md"

def get_latest_story_output_path() -> Path:
    files = sorted(OUTPUTS_DIR.glob("agent_b_story_output_*.json"))
    if not files:
        raise FileNotFoundError(f"No story output files found in {OUTPUTS_DIR}")
    return files[-1]

BANNED_WORDS = {
    "insane",
    "crazy",
    "game-changing",
    "revolutionary",
    "mind-blowing",
    "unbelievable",
    "viral",
}


def read_json(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in {path}: {e}")


def read_text(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Missing file: {path}")
    return path.read_text(encoding="utf-8")


def extract_headlines(text: str) -> set[str]:
    matches = re.findall(r"^Headline:\s*(.+)$", text, flags=re.MULTILINE)
    return {m.strip() for m in matches if m.strip()}


def validate_top_level(data: dict) -> list[str]:
    errors = []

    required_top_fields = ["slides"]
    for field in required_top_fields:
        if field not in data:
            errors.append(f"Missing top-level field: {field}")

    if "slides" in data and not isinstance(data["slides"], list):
        errors.append("Field 'slides' must be a list")

    if "slides" in data and isinstance(data["slides"], list):
        if not (1 <= len(data["slides"]) <= 3):
            errors.append("Slides must contain between 1 and 3 items")

    return errors


def validate_slide(slide: dict, index: int) -> list[str]:
    errors = []

    required_fields = [
        "slide_number",
        "hook",
        "body",
        "cta",
        "visual_direction",
        "source_topic_headline",
    ]

    for field in required_fields:
        if field not in slide:
            errors.append(f"Slide {index}: missing field '{field}'")
        elif isinstance(slide[field], str) and not slide[field].strip():
            errors.append(f"Slide {index}: field '{field}' is empty")

    if "cta" in slide and slide.get("cta") != "Swipe for details":
        errors.append(f"Slide {index}: cta must be exactly 'Swipe for details'")

    return errors


def validate_banned_words(data: dict) -> list[str]:
    errors = []
    text_parts = []

    for slide in data.get("slides", []):
        for key in ["hook", "body", "cta"]:
            value = slide.get(key, "")
            if isinstance(value, str):
                text_parts.append(value.lower())

    combined = " ".join(text_parts)

    for word in BANNED_WORDS:
        if word.lower() in combined:
            errors.append(f"Banned word found: {word}")

    return errors


def validate_source_headlines(data: dict) -> list[str]:
    errors = []
    research_text = read_text(RESEARCH_INPUT_PATH)
    valid_headlines = extract_headlines(research_text)

    for i, slide in enumerate(data.get("slides", []), start=1):
        headline = slide.get("source_topic_headline", "").strip()
        if headline not in valid_headlines:
            errors.append(
                f"Slide {i}: source_topic_headline not found verbatim in research input: {headline}"
            )

    return errors


def main() -> None:
    story_output_path = get_latest_story_output_path()
    data = read_json(story_output_path)
    print(f"Validating: {story_output_path}")

    errors = []
    errors.extend(validate_top_level(data))

    for i, slide in enumerate(data.get("slides", []), start=1):
        if not isinstance(slide, dict):
            errors.append(f"Slide {i}: must be an object")
            continue
        errors.extend(validate_slide(slide, i))

    errors.extend(validate_banned_words(data))
    errors.extend(validate_source_headlines(data))

    if errors:
        print("VALIDATION FAILED")
        for err in errors:
            print(f"- {err}")
    else:
        print("VALIDATION PASSED")


if __name__ == "__main__":
    main()