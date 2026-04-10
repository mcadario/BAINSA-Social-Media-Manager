# BAINSA Brand Memory

## identity
- brand_name: BAINSA
- full_name: Bocconi AI & Neuroscience Student Association

## tone
- keywords:
  - minimalistic
  - retro-futurism
  - tech
  - formal
  - educational
- voice_traits:
  - clean
  - controlled
  - concise
  - formal
  - educational
  - direct
  - no-buzzword
- banned_tone_traits:
  - hype
  - exaggerated
  - chaotic
  - noisy
  - cluttered
  - overly decorative
  - buzzword-heavy
  - slangy

## typography
- heading_font: Alliance No.2
- heading_weight: semi-bold
- body_font: Alliance No.1
- body_weight_allowed:
  - regular
  - semi-bold
- forbidden_font_rules:
  - do not use bold

## layout
- preferred_alignment:
  - justify when possible
  - otherwise left
- allowed_alignment:
  - justify
  - left
- forbidden_alignment:
  - right
  - centre
- spacing_style:
  - clean
  - minimal
  - structured

## logos
- association_logo_variants:
  - main BAINSA logo
  - Bocconi-only communications logo
  - short logo for profile pics
- division_icons_or_logos:
  - Projects logo
  - Analysis logo
  - Culture logo
- usage_rules:
  - Bocconi-only communications logo is only for Bocconi communications
  - short logo is for profile-picture use
- forbidden_logo_rules:
  - do not colour the logo any colour outside approved white (#f4f3f3) or approved black (#0a0a0a)

## colors
- base_colors:
  - white: #f4f3f3
  - black: #0a0a0a
- accent_colors_by_division:
  - projects: #2740eb
  - analysis: #fe6203
  - culture: #fe43a7
- forbidden_color_rules:
  - do not use gradients
  - do not mix colours in the same post/story or any other digital product unless specified
  - do not recolour logos outside approved black/white

## visual_style
- aesthetic_keywords:
  - minimalistic
  - retro-futurism
  - tech
- allowed_graphic_elements:
  - corner elements
  - corner elements used as bullet points
  - small right-pointing arrow for swipe CTA
- forbidden_visual_elements:
  - gradients
  - excessive colour mixing
  - cluttered compositions

## brand_vocabulary
- preferred:
  - clear educational language
  - direct explanatory language
  - precise wording
  - grounded AI terminology
  - concrete wording over trend language
- avoid:
  - hype language
  - buzzwords
  - exaggerated superlatives
  - vague trend-chasing language
  - words like "insane", "crazy", and similar overhyped language
- recurring_messaging_patterns:
  - start with a clear informational hook
  - follow with one concise explanatory body section
  - keep the message educational and direct
  - avoid unnecessary flourish
- cta_style_guidance:
  - direct
  - minimal
  - non-pushy
  - use "Swipe for details" at the bottom
  - include a small arrow pointing right on the right side

## instagram_story_rules
- hook_style:
  - short
  - punchy
  - clear
  - informative
  - easy to scan
- body_style:
  - concise
  - educational
  - formal
  - direct
  - no buzzwords
- cta_style:
  - Swipe for details
  - placed at the bottom
  - accompanied by a small right-pointing arrow on the right
- readability_rules:
  - avoid clutter
  - preserve strong hierarchy
  - keep text scannable
  - keep layout minimal
  - maintain visual balance
  - do not overload slides with text
- spacing_or_safe_margin_guidance:
  - keep compositions clean and structured
  - preserve breathing room around text and graphic elements

## hard_constraints
- must_have_brand_memory: true
- must_not_generate_if_missing_fields: true
- must_not_break_visual_rules: true
- enforced_rules:
  - do not use bold
  - do not align content to the right
  - do not align content to the centre
  - do not use gradients
  - do not recolour logos outside approved black/white
  - do not mix colours in the same post/story unless explicitly specified
  - do not use hype-heavy or buzzword-heavy copy

## extraction_metadata
- source_files:
  - BAINSA Brand Guidelines.pdf
- confidence_flags:
  - identity: high
  - tone: medium
  - typography: high
  - layout: medium to high
  - logos: high
  - colors: high
  - visual_style: high
  - brand_vocabulary: medium
  - instagram_story_rules: medium
  - hard_constraints: high
- fields_completed_from_additional_project_context:
  - full_name
  - projects accent color
  - formal and educational tone direction
  - no-buzzword writing rule
  - avoid-word guidance
  - CTA behavior
  - recurring messaging patterns
- fields_needing_manual_review:
  - none currently