# Test Extraction Notes

## Source File
- BAINSA Brand Guidelines.pdf

## identity
- brand_name: BAINSA
- full_name: Bocconi AI & Neuroscience Student Association
- confidence: medium
- evidence: visible in logo / Bocconi communication variant

## tone
- keywords:
  - minimalistic
  - retro-futurism
  - tech
- voice_traits:
  - clean
  - controlled
  - concise
- banned_tone_traits:
  - noisy
  - cluttered
  - overly decorative
- confidence: medium
- evidence: explicit aesthetic text + visual style

## typography
- heading_font: Alliance No.2
- heading_weight: semi-bold
- body_font: Alliance No.1
- body_weight_allowed:
  - regular
  - semi-bold
- forbidden_font_rules:
  - do not use bold
- confidence: high
- evidence: explicit text in PDF

## layout
- preferred_alignment:
  - justify when possible
  - otherwise left
- allowed_alignment:
  - justify
  - left
- forbidden_alignment:
  - right
  - center
- spacing_style:
  - clean
  - minimal
  - not crowded
- confidence: high for alignment, medium for spacing_style
- evidence: explicit alignment text + visual layout

## logos
- approved_logo_variants:
  - main BAINSA logo
  - Bocconi-only communications logo
  - short logo for profile pics
- usage_rules:
  - Bocconi communication logo only for Bocconi communications
- forbidden_logo_rules:
  - do not recolor outside approved black/white
- confidence: high
- evidence: explicit text + page visuals

## colors
- base_colors:
  - white: #f4f3f3
  - black: #0a0a0a
- accent_colors_by_division:
  - analysis: #fe6203
  - culture: #fe43a7
  - projects: needs review
- forbidden_color_rules:
  - no gradients
  - do not mix colors in same post/story unless specified
  - do not recolor logo outside approved black/white
- confidence: high except projects color
- evidence: explicit text, but projects color looks inconsistent and needs review

## visual_style
- aesthetic_keywords:
  - minimalistic
  - retro-futurism
  - tech
- allowed_graphic_elements:
  - corner elements
  - bullet-like corner motifs
- forbidden_visual_elements:
  - gradients
  - excessive color mixing
- confidence: high
- evidence: explicit text + visual examples

## story_rules
- hook_style:
  - short
  - punchy
  - easy to scan
- body_style:
  - concise
  - clean
  - informative
- cta_style:
  - not specified in source
- readability_rules:
  - avoid clutter
  - preserve strong hierarchy
  - keep layout minimal
- confidence: low to medium
- evidence: inferred from brand style, not strongly explicit

## hard_constraints
- must_have_brand_memory: yes
- must_not_generate_if_missing_fields: yes
- must_not_break_visual_rules: yes
- confidence: medium
- evidence: project logic + strict brand requirement

## fields_needing_manual_review
- projects accent color
- whether full association name should be stored from this PDF alone or another source too
- whether story-specific writing rules should remain inferred or be left blank unless another source confirms them