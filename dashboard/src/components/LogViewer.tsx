'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { LogEntry, LogType, AgentStatus } from '@/lib/types';

interface LogViewerProps {
  onStatusChange?: (status: AgentStatus) => void;
  onOutputReady?: (filename: string) => void;
}

const TYPE_STYLES: Record<LogType, string> = {
  stdout: 'text-bainsa-white',
  stderr: 'text-red-400',
  system: 'text-bainsa-blue',
};

const TYPE_LABELS: Record<LogType, string> = {
  stdout: 'OUT',
  stderr: 'ERR',
  system: 'SYS',
};

export default function LogViewer({ onStatusChange, onOutputReady }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<LogType | 'all'>('all');
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  // Track the highest log ID seen so reconnects only fetch new entries
  const lastSeenIdRef = useRef(-1);
  // Track the run generation so we can clear logs when a new run starts
  const runGenerationRef = useRef(-1);

  // Connect to the SSE endpoint
  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    // Only request logs the client hasn't seen yet
    const url = `/api/logs?after=${lastSeenIdRef.current}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('open', () => setConnected(true));

    es.addEventListener('log', (e) => {
      const entry = JSON.parse(e.data) as LogEntry;
      // Guard: skip anything we've already displayed (belt-and-suspenders)
      if (entry.id <= lastSeenIdRef.current) return;
      lastSeenIdRef.current = entry.id;
      setLogs((prev) => [...prev, entry]);
    });

    es.addEventListener('status', (e) => {
      const data = JSON.parse(e.data);
      // If the server started a brand-new run, clear local log state
      if (
        data.runGeneration !== undefined &&
        runGenerationRef.current !== -1 &&
        data.runGeneration !== runGenerationRef.current
      ) {
        setLogs([]);
        lastSeenIdRef.current = -1;
      }
      runGenerationRef.current = data.runGeneration ?? runGenerationRef.current;

      onStatusChange?.(data.status);
      if (data.lastOutputFile) {
        onOutputReady?.(data.lastOutputFile);
      }
    });

    es.addEventListener('ready', () => {
      setConnected(true);
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Retry after 3 s — pass current lastSeenId so we don't re-download old logs
      setTimeout(connect, 3000);
    };
  }, [onStatusChange, onOutputReady]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
    };
  }, [connect]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Detect manual scroll-up to disable auto-scroll
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  };

  const clearLogs = () => {
    setLogs([]);
    // Don't reset lastSeenIdRef — we still don't want old server logs re-delivered
  };

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.type === filter);

  return (
    <section className="flex flex-col gap-3 h-full min-h-0">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 border-l-2 border-t-2"
            style={{ borderColor: '#fe6203' }}
          />
          <h2 className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-bainsa-muted">
            Real-Time Logs
          </h2>
          {connected ? (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-mono text-[9px] text-green-400 uppercase">Live</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              <span className="font-mono text-[9px] text-red-400 uppercase">Reconnecting</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex rounded-sm border border-bainsa-border overflow-hidden">
            {(['all', 'stdout', 'system', 'stderr'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`
                  px-2 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors
                  ${filter === t
                    ? 'bg-bainsa-blue text-bainsa-white'
                    : 'text-bainsa-muted hover:text-bainsa-white'
                  }
                `}
              >
                {t === 'all' ? 'All' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <button
            onClick={clearLogs}
            className="rounded-sm border border-bainsa-border px-2 py-1 font-mono text-[9px]
                       uppercase tracking-widest text-bainsa-muted hover:text-bainsa-white
                       hover:border-bainsa-white/30 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Log container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto rounded-sm border border-bainsa-border
                   bg-bainsa-black font-mono text-[11px] leading-relaxed p-3 space-y-0.5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(244,243,243,0.15) transparent' }}
      >
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-bainsa-muted text-xs">
              {logs.length === 0
                ? 'No logs yet. Run Agent B to start the pipeline.'
                : 'No logs match the current filter.'}
            </p>
          </div>
        ) : (
          filtered.map((entry) => (
            <LogLine key={entry.id} entry={entry} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex-shrink-0 w-full rounded-sm border border-bainsa-border py-1.5
                     font-mono text-[10px] uppercase tracking-widest text-bainsa-muted
                     hover:text-bainsa-white transition-colors text-center"
        >
          ↓ Scroll to latest
        </button>
      )}
    </section>
  );
}

function LogLine({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const typeColor: Record<LogType, string> = {
    stdout: 'text-bainsa-blue/60',
    stderr: 'text-red-400/60',
    system: 'text-bainsa-orange/60',
  };

  return (
    <div className="flex gap-2 group hover:bg-bainsa-white/[0.02] rounded-sm px-1 py-0.5">
      {/* Timestamp */}
      <span className="flex-shrink-0 text-bainsa-muted/50 select-none">{time}</span>
      {/* Type badge */}
      <span className={`flex-shrink-0 w-7 text-center ${typeColor[entry.type]} select-none`}>
        {TYPE_LABELS[entry.type]}
      </span>
      {/* Message */}
      <span className={`flex-1 break-all ${TYPE_STYLES[entry.type]}`}>
        {entry.message}
      </span>
    </div>
  );
}
