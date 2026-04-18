/**
 * GET /api/logs
 *
 * Server-Sent Events (SSE) endpoint.
 *
 * On connection:
 *  1. Flushes unseen log buffer (id > ?after param) — no duplicate spam on reconnect.
 *  2. Keeps the connection open with a 15 s heartbeat ping.
 *  3. Pushes new log entries in real time via the agentState listener system.
 */

import { addListener, getState, removeListener } from '@/lib/agentState';
import type { LogEntry } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function encodeSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  // Client sends ?after=<lastSeenId> on reconnect — only replay unseen logs.
  const url = new URL(request.url);
  const afterId = parseInt(url.searchParams.get('after') ?? '-1', 10);

  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const enqueue = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(encodeSSE(event, data)));
        } catch {
          closed = true;
        }
      };

      // ── 1. Initial state snapshot ────────────────────────────────────
      const snap = getState();

      enqueue('status', {
        status:         snap.status,
        startTime:      snap.startTime,
        endTime:        snap.endTime,
        exitCode:       snap.exitCode,
        lastOutputFile: snap.lastOutputFile,
        runGeneration:  snap.runGeneration,
      });

      // Only replay logs the client hasn't seen yet
      const unseen = snap.logs.filter((l) => l.id > afterId);
      for (const entry of unseen) {
        enqueue('log', entry);
      }

      enqueue('ready', { bufferedCount: unseen.length });

      // ── 2. Live log listener ─────────────────────────────────────────
      const logListener = (entry: LogEntry) => {
        enqueue('log', entry);
      };

      addListener(logListener);

      // ── 3. Heartbeat — keeps the Node.js event loop alive ────────────
      // Without this, the stream closes immediately after start() returns
      // because nothing holds the event loop open. The SSE comment syntax
      // ": ping\n\n" is invisible to clients but prevents connection drops.
      heartbeat = setInterval(() => {
        if (closed) {
          if (heartbeat) clearInterval(heartbeat);
          return;
        }
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          closed = true;
          if (heartbeat) clearInterval(heartbeat);
        }
      }, 15_000);

      // ── 4. Cleanup on client disconnect ──────────────────────────────
      request.signal.addEventListener('abort', () => {
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        removeListener(logListener);
        try { controller.close(); } catch { /* already closed */ }
      });
    },

    cancel() {
      // Called if the consumer cancels the stream
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',   // disable Nginx buffering
    },
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
