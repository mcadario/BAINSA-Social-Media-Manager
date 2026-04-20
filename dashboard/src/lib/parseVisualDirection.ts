/**
 * Parses the `visual_direction` field from Agent B output to extract
 * rendering hints for the Instagram preview.
 */

export interface VisualHints {
  /** Hex accent colour derived from visual_direction */
  accentColor: string;
  /** Whether the slide uses a dark (black) background */
  isDarkBackground: boolean;
  /** Background colour */
  bgColor: string;
  /** Primary text colour */
  textColor: string;
}

const BAINSA_BLUE   = '#2740eb';
const BAINSA_ORANGE = '#fe6203';
const BAINSA_PINK   = '#fe43a7';
const BAINSA_BLACK  = '#0a0a0a';
const BAINSA_WHITE  = '#f4f3f3';

/** Ordered list of known accent colours – most specific first */
const KNOWN_ACCENTS = [BAINSA_BLUE, BAINSA_ORANGE, BAINSA_PINK];

export function parseVisualDirection(visualDirection: string): VisualHints {
  const lower = visualDirection.toLowerCase();

  // ------------------------------------------------------------------ accent
  // 1. Try to find a hex colour in the string
  const hexMatch = visualDirection.match(/#([0-9a-fA-F]{6})/);
  let accentColor: string = BAINSA_BLUE; // default

  if (hexMatch) {
    const candidate = `#${hexMatch[1]}`;
    // Prefer known BAINSA accents for exact matches
    const known = KNOWN_ACCENTS.find(
      (c) => c.toLowerCase() === candidate.toLowerCase(),
    );
    accentColor = known ?? candidate;
  } else {
    // Fallback: infer from colour keywords
    if (lower.includes('orange')) accentColor = BAINSA_ORANGE;
    else if (lower.includes('pink')) accentColor = BAINSA_PINK;
    else if (lower.includes('blue')) accentColor = BAINSA_BLUE;
  }

  // --------------------------------------------------------------- background
  const isDarkBackground =
    lower.includes('black background') ||
    lower.includes('dark background') ||
    (!lower.includes('white background') && !lower.includes('light background'));

  const bgColor    = isDarkBackground ? BAINSA_BLACK : BAINSA_WHITE;
  const textColor  = isDarkBackground ? BAINSA_WHITE : BAINSA_BLACK;

  return { accentColor, isDarkBackground, bgColor, textColor };
}
