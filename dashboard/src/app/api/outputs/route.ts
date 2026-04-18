/**
 * GET /api/outputs
 *
 * Returns a list of all Agent B output JSON files, sorted newest first.
 * Each item includes the filename, parsed timestamp, and slide count.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { OUTPUTS_DIR } from '@/lib/paths';
import type { OutputFile, OutputsResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Parse the timestamp embedded in the filename, e.g. agent_b_story_output_20260409_213040.json */
function parseTimestamp(filename: string): string {
  const match = filename.match(/(\d{8})_(\d{6})/);
  if (!match) return new Date().toISOString();

  const dateStr = match[1]; // "20260409"
  const timeStr = match[2]; // "213040"

  const year   = dateStr.slice(0, 4);
  const month  = dateStr.slice(4, 6);
  const day    = dateStr.slice(6, 8);
  const hour   = timeStr.slice(0, 2);
  const minute = timeStr.slice(2, 4);
  const second = timeStr.slice(4, 6);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

function formatDateLabel(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export async function GET(): Promise<NextResponse<OutputsResponse>> {
  if (!fs.existsSync(OUTPUTS_DIR)) {
    return NextResponse.json({ files: [] });
  }

  const entries = fs.readdirSync(OUTPUTS_DIR);
  const jsonFiles = entries
    .filter((f) => f.startsWith('agent_b_story_output_') && f.endsWith('.json'))
    .sort()
    .reverse(); // newest first

  const files: OutputFile[] = jsonFiles.map((filename) => {
    let slideCount = 0;
    try {
      const raw = fs.readFileSync(path.join(OUTPUTS_DIR, filename), 'utf-8');
      const parsed = JSON.parse(raw);
      slideCount = Array.isArray(parsed.slides) ? parsed.slides.length : 0;
    } catch {
      slideCount = 0;
    }

    const timestamp = parseTimestamp(filename);
    return {
      filename,
      timestamp,
      dateLabel: formatDateLabel(timestamp),
      slideCount,
    };
  });

  return NextResponse.json({ files });
}
