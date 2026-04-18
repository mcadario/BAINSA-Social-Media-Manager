/**
 * GET /api/status
 *
 * Returns the current agent run state as JSON.
 * Used by the client as a polling fallback if SSE is unavailable,
 * and on initial page load to hydrate the UI.
 */

import { NextResponse } from 'next/server';
import { getState } from '@/lib/agentState';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const state = getState();
  return NextResponse.json({
    status: state.status,
    startTime: state.startTime,
    endTime: state.endTime,
    exitCode: state.exitCode,
    lastOutputFile: state.lastOutputFile,
  });
}
