'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AgentStatus } from '@/lib/types';
import Header from '@/components/Header';
import AgentControlPanel from '@/components/AgentControlPanel';
import LogViewer from '@/components/LogViewer';
import OutputGallery from '@/components/OutputGallery';

export default function DashboardPage() {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [lastOutputFile, setLastOutputFile] = useState<string | null>(null);
  const [highlightFile, setHighlightFile] = useState<string | null>(null);

  // Hydrate state from server on mount
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.status ?? 'idle');
        setStartTime(data.startTime ?? null);
        setEndTime(data.endTime ?? null);
        setExitCode(data.exitCode ?? null);
        setLastOutputFile(data.lastOutputFile ?? null);
      })
      .catch(() => {}); // Non-critical
  }, []);

  // Called by LogViewer's SSE status events
  const handleStatusChange = useCallback((incoming: AgentStatus) => {
    setStatus(incoming);
  }, []);

  const handleOutputReady = useCallback((filename: string) => {
    setLastOutputFile(filename);
    setHighlightFile(filename); // Triggers OutputGallery to auto-load
  }, []);

  // Run Agent B (real)
  const handleRun = async () => {
    setStatus('running');
    setStartTime(new Date().toISOString());
    setEndTime(null);
    setExitCode(null);

    try {
      const res = await fetch('/api/run-agent', { method: 'POST' });
      const data = await res.json();
      if (!data.ok) {
        console.error('[Dashboard] run-agent error:', data.message);
      }
    } catch (err) {
      console.error('[Dashboard] fetch error:', err);
      setStatus('error');
    }
  };

  // Mock run — streams fake logs, loads most recent existing output
  const handleMockRun = async () => {
    setStatus('running');
    setStartTime(new Date().toISOString());
    setEndTime(null);
    setExitCode(null);

    try {
      await fetch('/api/run-agent?mock=true', { method: 'POST' });
    } catch (err) {
      console.error('[Dashboard] mock run error:', err);
      setStatus('error');
    }
  };

  // Stop Agent B
  const handleStop = async () => {
    try {
      await fetch('/api/run-agent', { method: 'DELETE' });
      setStatus('idle');
      setEndTime(new Date().toISOString());
    } catch {}
  };

  // When user clicks a link in the agent panel
  const handleViewOutput = (filename: string) => {
    setHighlightFile(filename);
  };

  return (
    <div className="flex min-h-screen flex-col bg-bainsa-black">
      <Header status={status} />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6">

        {/* ── Top grid: Control | Preview | Logs ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_340px] gap-5 mb-8">

          {/* ── Col 1: Agent Control Panel ── */}
          <div>
            <AgentControlPanel
              status={status}
              startTime={startTime}
              endTime={endTime}
              exitCode={exitCode}
              lastOutputFile={lastOutputFile}
              onRun={handleRun}
              onMockRun={handleMockRun}
              onStop={handleStop}
              onViewOutput={handleViewOutput}
            />
          </div>

          {/* ── Col 2: Output Gallery + Instagram Preview ── */}
          <div
            className="rounded-sm border border-bainsa-border bg-bainsa-surface p-5"
            style={{ minHeight: '480px' }}
          >
            <OutputGallery highlightFile={highlightFile} />
          </div>

          {/* ── Col 3: Real-Time Logs ── */}
          <div
            className="rounded-sm border border-bainsa-border bg-bainsa-surface p-5 flex flex-col"
            style={{ minHeight: '480px' }}
          >
            <LogViewer
              onStatusChange={(s) => {
                handleStatusChange(s);
                // Sync timing from SSE status events
                if (s === 'running') setStartTime((prev) => prev ?? new Date().toISOString());
                if (s === 'success' || s === 'error') setEndTime(new Date().toISOString());
              }}
              onOutputReady={handleOutputReady}
            />
          </div>
        </div>

        {/* ── Pipeline overview strip ── */}
        <PipelineOverview />

        {/* ── Footer ── */}
        <footer className="mt-10 flex items-center justify-between">
          <span className="font-mono text-[10px] text-bainsa-muted uppercase tracking-widest">
            BAINSA · Bocconi's Association in Neuroscience and Artificial Intelligence
          </span>
          <span className="font-mono text-[10px] text-bainsa-muted/40">
            Human-in-the-Loop Dashboard · v0.1
          </span>
        </footer>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline overview strip
// ---------------------------------------------------------------------------

interface Step {
  id: number;
  code: string;
  label: string;
  description: string;
  accentColor: string;
}

const PIPELINE_STEPS: Step[] = [
  {
    id: 1,
    code: 'Step 1',
    label: 'Brand Memory',
    description: 'Extracts tone, typography, colour rules from BAINSA PDF',
    accentColor: '#2740eb',
  },
  {
    id: 2,
    code: 'Agent A',
    label: 'Research',
    description: 'Fetches & ranks top AI news → top_articles.md',
    accentColor: '#fe6203',
  },
  {
    id: 3,
    code: 'Agent B',
    label: 'Content Creator',
    description: 'Generates brand-compliant Story copy via Gemini',
    accentColor: '#fe43a7',
  },
  {
    id: 4,
    code: 'Dashboard',
    label: 'Human Approval',
    description: 'Edit, verify brand compliance, approve for publishing',
    accentColor: '#f4f3f3',
  },
];

function PipelineOverview() {
  return (
    <div className="rounded-sm border border-bainsa-border bg-bainsa-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="inline-block h-3 w-3 border-l-2 border-t-2"
          style={{ borderColor: '#f4f3f3' }}
        />
        <h2 className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-bainsa-muted">
          Pipeline Architecture
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.id} className="relative flex gap-3">
            {/* Step card */}
            <div
              className="flex-1 rounded-sm border p-3 space-y-1"
              style={{
                borderColor: `${step.accentColor}33`,
                backgroundColor: `${step.accentColor}08`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: step.accentColor }}
                />
                <span
                  className="font-mono text-[9px] uppercase tracking-widest"
                  style={{ color: step.accentColor }}
                >
                  {step.code}
                </span>
              </div>
              <p className="font-heading text-xs font-semibold text-bainsa-white">
                {step.label}
              </p>
              <p className="font-body text-[10px] text-bainsa-muted leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Arrow connector */}
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="hidden md:flex items-center absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 8H12M9 5L12 8L9 11" stroke="rgba(244,243,243,0.2)"
                        strokeWidth="1.5" strokeLinecap="square"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
