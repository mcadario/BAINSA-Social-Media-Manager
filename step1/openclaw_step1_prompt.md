# OpenClaw Step 1 Prompt

## Task
Read the provided brand PDF documents and extract the brand identity rules into a structured Markdown memory file.

## Goal
Produce a `brand_memory.md` output that can be used as an authoritative constraint file for downstream content generation.

## Requirements
- Use information found in the source documents only
- Extract both explicit text rules and visually communicated rules when supported by the document
- Organize findings into the provided schema
- Do not hardcode brand-specific assumptions
- Do not invent missing values
- If a field is unclear, conflicting, or weakly supported, mark it as needing review

## Extract the following categories
- identity
- tone
- typography
- layout
- logos
- colors
- visual_style
- story_rules
- hard_constraints
- extraction_metadata

## Extraction behavior
- Preserve page-level evidence where possible
- Distinguish explicit rules from inferred observations
- Use confidence labels such as high, medium, low
- Mark uncertain fields in `fields_needing_manual_review`
- If a value is not reliably supported by the source, return `unknown` rather than guessing

## Output format
Return a Markdown file following the structure defined in `brand_memory_template.md`.

## Anti-hardcoding rules
- Never fill fields from prior knowledge of the brand
- Never assume missing values
- Never use brand-name-specific logic