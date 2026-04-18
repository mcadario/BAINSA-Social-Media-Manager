/**
 * POST /api/run-agent
 *
 * Spawns the non-interactive Python gateway script as a child process.
 * Pipes its stdout/stderr into the shared agentState log buffer so that
 * any open /api/logs SSE connection receives the output in real time.
 *
 * Pass ?mock=true to run a simulated pipeline using the most recent
 * existing output file — no API key required.
 */

import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  addLog,
  cancelMock,
  clearLogs,
  getProcess,
  isMockCancelled,
  isRunning,
  setEndTime,
  setExitCode,
  setLastOutputFile,
  setProcess,
  setStartTime,
  setStatus,
} from '@/lib/agentState';
import { OUTPUTS_DIR, RUNNER_SCRIPT } from '@/lib/paths';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Mock run — plays back a realistic log sequence using an existing output
// ---------------------------------------------------------------------------
async function runMock() {
  // Find the latest output file to "replay"
  let replayFile: string | null = null;
  if (fs.existsSync(OUTPUTS_DIR)) {
    const files = fs
      .readdirSync(OUTPUTS_DIR)
      .filter((f) => f.startsWith('agent_b_story_output_') && f.endsWith('.json'))
      .sort();
    if (files.length > 0) replayFile = files[files.length - 1];
  }

  // Cancellable delay: resolves early if mock is cancelled
  const delay = (ms: number) =>
    new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ms);
      // Poll for cancellation every 50 ms
      const poll = setInterval(() => {
        if (isMockCancelled()) {
          clearTimeout(timer);
          clearInterval(poll);
          resolve();
        }
      }, 50);
      // Clean up poll when timer fires naturally
      setTimeout(() => clearInterval(poll), ms + 10);
    });

  const steps: Array<{ ms: number; msg: string; type: 'stdout' | 'system' }> = [
    { ms: 300,  msg: 'BAINSA Agent B pipeline starting… [MOCK MODE]', type: 'system' },
    { ms: 400,  msg: 'API key loaded ✓',                               type: 'stdout' },
    { ms: 400,  msg: 'Reading brand memory…',                          type: 'stdout' },
    { ms: 300,  msg: 'Loaded brand_memory_final.md',                   type: 'stdout' },
    { ms: 300,  msg: 'Reading research input…',                        type: 'stdout' },
    { ms: 300,  msg: 'Loaded top_articles.md',                         type: 'stdout' },
    { ms: 300,  msg: 'Reading agent prompt…',                          type: 'stdout' },
    { ms: 300,  msg: 'Loaded agent_b_prompt.md',                       type: 'stdout' },
    { ms: 400,  msg: 'Building prompt…',                               type: 'stdout' },
    { ms: 500,  msg: 'Calling Gemini API (this may take 20–60 seconds)…', type: 'stdout' },
    { ms: 2500, msg: 'Gemini response received ✓',                     type: 'stdout' },
    { ms: 300,  msg: 'Parsed 2 slide(s) ✓',                           type: 'stdout' },
    { ms: 400,  msg: replayFile
        ? `Output saved → ${replayFile}`
        : 'No existing output found — run with a real API key first.', type: 'stdout' },
    { ms: 300,  msg: 'Running brand validator…',                       type: 'stdout' },
    { ms: 500,  msg: `Validating: outputs/${replayFile ?? '—'}`,       type: 'stdout' },
    { ms: 400,  msg: 'VALIDATION PASSED',                              type: 'stdout' },
    { ms: 200,  msg: 'Validation passed ✓',                           type: 'stdout' },
    { ms: 300,  msg: 'Pipeline complete!',                             type: 'stdout' },
  ];

  for (const step of steps) {
    await delay(step.ms);
    if (isMockCancelled()) return; // Bail out cleanly
    addLog(step.msg, step.type);
  }

  if (isMockCancelled()) return;

  if (replayFile) {
    setLastOutputFile(replayFile);
    addLog(`Output file ready: ${replayFile}`, 'system');
  }

  setExitCode(0);
  setEndTime(new Date().toISOString());
  setStatus('success');
  addLog('Mock run complete — previewing existing output above ↑', 'system');
}

// ---------------------------------------------------------------------------
// Real run
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const url = new URL(request.url);
  const mock = url.searchParams.get('mock') === 'true';

  // Guard: do not allow concurrent runs
  if (isRunning()) {
    return NextResponse.json(
      { ok: false, message: 'Agent is already running. Wait for it to finish.' },
      { status: 409 },
    );
  }

  // Reset state for the new run
  clearLogs();
  setStatus('running');
  setStartTime(new Date().toISOString());
  setEndTime(null);
  setExitCode(null);
  setLastOutputFile(null);

  if (mock) {
    addLog('Dashboard: starting MOCK run (no API key used)', 'system');
    // Fire-and-forget — the SSE stream picks up logs asynchronously
    runMock().catch((err) => {
      addLog(`Mock error: ${String(err)}`, 'stderr');
      setStatus('error');
      setEndTime(new Date().toISOString());
    });
    return NextResponse.json({ ok: true, message: 'Mock run started.' });
  }

  addLog('Dashboard: triggering Agent B pipeline…', 'system');
  addLog(`Runner script: ${RUNNER_SCRIPT}`, 'system');

  // Resolve the python3 binary: prefer the 'bainsa' conda env if it exists,
  // otherwise fall back to whatever python3 is on PATH.
  function resolvePython(): string {
    const os = require('os') as typeof import('os');
    const fs = require('fs') as typeof import('fs');
    const candidates = [
      // Miniconda/Anaconda default locations on macOS
      `${os.homedir()}/miniconda3/envs/bainsa/bin/python`,
      `${os.homedir()}/anaconda3/envs/bainsa/bin/python`,
      `${os.homedir()}/opt/miniconda3/envs/bainsa/bin/python`,
      `${os.homedir()}/opt/anaconda3/envs/bainsa/bin/python`,
      '/opt/homebrew/Caskroom/miniconda/base/envs/bainsa/bin/python',
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return 'python3'; // system fallback
  }

  const pythonBin = resolvePython();
  addLog(`Python: ${pythonBin}`, 'system');

  // Spawn the Python runner
  const proc = spawn(pythonBin, [RUNNER_SCRIPT], {
    env: { ...process.env },
    cwd: process.cwd(),
  });

  setProcess(proc);

  // Stream stdout
  proc.stdout?.on('data', (chunk: Buffer) => {
    const text = chunk.toString('utf-8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('DASHBOARD_OUTPUT_FILE:')) {
        const filename = trimmed.replace('DASHBOARD_OUTPUT_FILE:', '').trim();
        setLastOutputFile(filename);
        addLog(`Output file ready: ${filename}`, 'system');
      } else {
        addLog(trimmed, 'stdout');
      }
    }
  });

  // Stream stderr
  proc.stderr?.on('data', (chunk: Buffer) => {
    const text = chunk.toString('utf-8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (trimmed) addLog(trimmed, 'stderr');
    }
  });

  // Handle exit
  proc.on('close', (code) => {
    setExitCode(code);
    setEndTime(new Date().toISOString());
    setProcess(null);

    if (code === 0) {
      setStatus('success');
      addLog('Pipeline finished successfully ✓', 'system');
    } else {
      setStatus('error');
      addLog(`Pipeline exited with code ${code}`, 'system');
    }
  });

  proc.on('error', (err) => {
    setStatus('error');
    setEndTime(new Date().toISOString());
    setProcess(null);
    addLog(`Failed to start process: ${err.message}`, 'stderr');
  });

  return NextResponse.json({ ok: true, message: 'Agent B started.' });
}

/**
 * DELETE /api/run-agent
 * Stops the current run — works for both real processes and mock runs.
 */
export async function DELETE() {
  // Cancel mock run if active (the async chain checks isMockCancelled())
  cancelMock();

  // Kill real process if one exists
  const proc = getProcess();
  if (proc) {
    addLog('Dashboard: terminating agent process…', 'system');
    proc.kill('SIGTERM');
    setTimeout(() => {
      try { proc.kill('SIGKILL'); } catch { /* already dead */ }
    }, 3000);
    setProcess(null);
  }

  setStatus('idle');
  setEndTime(new Date().toISOString());
  addLog('Agent stopped by user.', 'system');

  return NextResponse.json({ ok: true, message: 'Stopped.' });
}
