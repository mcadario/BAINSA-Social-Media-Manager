/**
 * GET /api/output/[filename]
 *
 * Returns the parsed JSON of a specific Agent B output file.
 * The filename is the bare name (e.g. agent_b_story_output_20260409_213040.json).
 *
 * Use "latest" as the filename to get the most recent output.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { OUTPUTS_DIR } from '@/lib/paths';
import type { OutputDetailResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { filename: string };
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  let { filename } = params;

  // Resolve "latest" alias
  if (filename === 'latest') {
    if (!fs.existsSync(OUTPUTS_DIR)) {
      return NextResponse.json({ error: 'No outputs directory found.' }, { status: 404 });
    }
    const files = fs
      .readdirSync(OUTPUTS_DIR)
      .filter((f) => f.startsWith('agent_b_story_output_') && f.endsWith('.json'))
      .sort();

    if (files.length === 0) {
      return NextResponse.json({ error: 'No output files found.' }, { status: 404 });
    }
    filename = files[files.length - 1];
  }

  // Security: prevent path traversal
  const safeName = path.basename(filename);
  if (safeName !== filename) {
    return NextResponse.json({ error: 'Invalid filename.' }, { status: 400 });
  }

  const filePath = path.join(OUTPUTS_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: `File not found: ${safeName}` }, { status: 404 });
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const response: OutputDetailResponse = { filename: safeName, data };
    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to parse file: ${String(err)}` },
      { status: 500 },
    );
  }
}
