# Step 1 Extraction Plan

## Goal
Convert one or more brand PDF files into a structured `brand_memory.md` file without hardcoding brand-specific values.

## Input
- PDF files containing brand rules
- Text content
- Visual content such as logos, layouts, and color examples

## Output
- `brand_memory.md`
- optional intermediate `brand_memory.json`
- extraction metadata with confidence flags

## Pipeline

### 1. Read source files
- Load all brand-related PDF files
- Extract raw text from each page
- Extract page images for visual inspection when needed

### 2. Segment the content
- Break extracted content into chunks by page and section
- Keep page references
- Preserve nearby headings and bullet structure

### 3. Detect candidate rules
Look for information related to:
- identity
- tone
- typography
- layout
- logos
- colors
- visual style
- story rules
- hard constraints

### 4. Normalize into schema
- Map extracted findings into the fixed schema
- Do not insert brand-specific values unless they were found in source material
- Keep unknown values as unknown

### 5. Add confidence tracking
For each important field:
- mark as `high`, `medium`, or `low` confidence
- flag unclear or conflicting fields for manual review

### 6. Write final memory file
- Produce clean Markdown output
- Keep sections consistent with `brand_memory_schema.md`
- Include extraction metadata

## Anti-hardcoding rules
- Never fill values because they are "expected"
- Never use brand-name-specific if/else logic
- Never guess colors, tone, or logo rules without source evidence
- If a field is unclear, mark it as needing review

## Success criteria
- The same pipeline can work on another brand PDF
- The output follows the same schema
- Uncertain fields are flagged instead of invented