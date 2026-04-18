'use client';

import { useState } from 'react';
import type { AgentStatus } from '@/lib/types';

interface AgentControlPanelProps {
  status: AgentStatus;
  startTime: string | null;
  endTime: string | null;
  exitCode: number | null;
  lastOutputFile: string | null;
  onRun: () => void;
  onMockRun: () => void;
  onStop: () => void;
  onViewOutput: (filename: string) => void;
}

function elapsed(start: string | null, end: string | null): string {
  if (!start) return '—';
  const a = new Date(start).getTime();
  const b = end ? new Date(end).getTime() : Date.now();
  const s = Math.round((b - a) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function AgentControlPanel({
  status,
  startTime,
  endTime,
  exitCode,
  lastOutputFile,
  onRun,
  onMockRun,
  onStop,
  onViewOutput,
}: AgentControlPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const isRunning = status === 'running';

  const handleRunClick = () => {
    if (confirming) {
      setConfirming(false);
      onRun();
    } else {
      setConfirming(true);
      // Auto-cancel the confirm state after 4 s
      setTimeout(() => setConfirming(false), 4000);
    }
  };

  return (
    <section className="flex flex-col gap-5">
      {/* Section title */}
      <div className="flex items-center gap-2">
        {/* Accent corner bracket */}
        <span
          className="inline-block h-3 w-3 border-l-2 border-t-2"
          style={{ borderColor: '#2740eb' }}
        />
        <h2 className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-bainsa-muted">
          Agent Control
        </h2>
      </div>

      {/* Agent card */}
      <div className="rounded-sm border border-bainsa-border bg-bainsa-surface p-5 space-y-5">

        {/* Agent identity */}
        <div>
          <p className="font-heading text-sm font-semibold text-bainsa-white">Agent B</p>
          <p className="mt-1 font-body text-xs text-bainsa-muted leading-relaxed">
            Reads brand memory and research handoff, then generates brand-compliant
            Instagram Story copy via Gemini.
          </p>
        </div>

        {/* Status row */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Status">
            <StatusPill status={status} />
          </Stat>
          <Stat label="Elapsed">
            <span className="font-mono text-sm text-bainsa-white">
              {elapsed(startTime, endTime)}
            </span>
          </Stat>
          {exitCode !== null && (
            <Stat label="Exit Code">
              <span
                className={`font-mono text-sm ${exitCode === 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {exitCode}
              </span>
            </Stat>
          )}
          {lastOutputFile && (
            <Stat label="Output">
              <button
                onClick={() => onViewOutput(lastOutputFile)}
                className="font-mono text-[11px] text-bainsa-blue underline underline-offset-2 hover:text-bainsa-white transition-colors text-left line-clamp-1"
              >
                {lastOutputFile.replace('agent_b_story_output_', '').replace('.json', '')}
              </button>
            </Stat>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!isRunning ? (
            <>
              <button
                onClick={handleRunClick}
                className={`
                  w-full rounded-sm px-4 py-3 font-heading text-sm font-semibold
                  tracking-widest uppercase transition-all duration-150
                  ${confirming
                    ? 'bg-bainsa-orange text-bainsa-black'
                    : 'bg-bainsa-blue text-bainsa-white hover:bg-bainsa-blue/80'
                  }
                `}
              >
                {confirming ? '⚡ Confirm Run?' : '▶ Run Agent B'}
              </button>
              <button
                onClick={onMockRun}
                className="w-full rounded-sm border border-bainsa-border px-4 py-2.5
                           font-heading text-xs font-semibold tracking-widest uppercase
                           text-bainsa-muted hover:text-bainsa-white hover:border-bainsa-white/30
                           transition-colors"
              >
                ◈ Mock Run (no API key)
              </button>
            </>
          ) : (
            <button
              onClick={onStop}
              className="w-full rounded-sm bg-red-600/20 border border-red-500/40 px-4 py-3
                         font-heading text-sm font-semibold tracking-widest uppercase text-red-400
                         hover:bg-red-600/30 transition-colors"
            >
              ■ Stop Agent
            </button>
          )}
        </div>
      </div>

      {/* Pre-flight checks */}
      <PreflightChecks />
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-bainsa-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: AgentStatus }) {
  const cfg: Record<AgentStatus, { color: string; label: string }> = {
    idle:    { color: 'text-bainsa-muted',  label: 'Idle'    },
    running: { color: 'text-bainsa-orange', label: 'Running' },
    success: { color: 'text-green-400',     label: 'Success' },
    error:   { color: 'text-red-400',       label: 'Error'   },
  };
  const { color, label } = cfg[status];
  return (
    <span className={`font-mono text-sm font-semibold ${color}`}>{label}</span>
  );
}

function PreflightChecks() {
  const checks = [
    { label: 'brand_memory_final.md',     desc: 'Brand rules memory' },
    { label: 'top_articles.md',           desc: 'Research handoff'   },
    { label: 'agent_b_prompt.md',         desc: 'Agent B prompt'     },
    { label: 'GEMINI_API_KEY in .env',    desc: 'Gemini API key'     },
  ];

  return (
    <div className="rounded-sm border border-bainsa-border bg-bainsa-surface p-4 space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-bainsa-muted">
        Pre-flight Checks
      </p>
      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2">
            <span
              className="mt-[2px] h-2 w-2 flex-shrink-0 rounded-full border"
              style={{ borderColor: '#2740eb', backgroundColor: 'rgba(39,64,235,0.2)' }}
            />
            <div>
              <p className="font-mono text-[11px] text-bainsa-white">{c.label}</p>
              <p className="font-body text-[10px] text-bainsa-muted">{c.desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="font-body text-[10px] text-bainsa-muted leading-relaxed">
        If any file is missing the runner will log an error and exit safely.
      </p>
    </div>
  );
}
