import path from 'path';
import fs from 'fs';

/**
 * Resolves the BAINSA project root from the dashboard directory.
 *
 * Resolution order:
 *  1. `PROJECT_ROOT` environment variable (explicit override)
 *  2. One directory above `process.cwd()` if `bainsa_pipeline/` exists there
 *  3. Two directories above `process.cwd()` (fallback)
 */
function resolveProjectRoot(): string {
  if (process.env.PROJECT_ROOT) {
    return process.env.PROJECT_ROOT;
  }

  // Next.js sets cwd to the app directory (i.e. dashboard/)
  const cwd = process.cwd();

  const oneUp = path.resolve(cwd, '..');
  if (fs.existsSync(path.join(oneUp, 'bainsa_pipeline'))) {
    return oneUp;
  }

  const twoUp = path.resolve(cwd, '..', '..');
  if (fs.existsSync(path.join(twoUp, 'bainsa_pipeline'))) {
    return twoUp;
  }

  // Last resort: walk up until we find the marker
  let dir = cwd;
  for (let i = 0; i < 5; i++) {
    dir = path.resolve(dir, '..');
    if (fs.existsSync(path.join(dir, 'bainsa_pipeline'))) {
      return dir;
    }
  }

  return oneUp; // Fallback – let runtime errors surface the misconfiguration
}

export const PROJECT_ROOT = resolveProjectRoot();

export const OUTPUTS_DIR = path.join(
  PROJECT_ROOT,
  'bainsa_pipeline',
  'agent_b',
  'outputs',
);

export const RUNNER_SCRIPT = path.join(
  PROJECT_ROOT,
  'bainsa_pipeline',
  'gateway',
  'run_agent_b.py',
);

export const BRAND_MEMORY_PATH = path.join(
  PROJECT_ROOT,
  'bainsa_pipeline',
  'step1',
  'brand_memory_final.md',
);

export const RESEARCH_INPUT_PATH = path.join(
  PROJECT_ROOT,
  'bainsa_pipeline',
  'agent_a',
  'output',
  'top_articles.md',
);

export const AGENT_A_SCRIPT = path.join(
  PROJECT_ROOT,
  'bainsa_pipeline',
  'agent_a',
  'top_n_news.py',
);