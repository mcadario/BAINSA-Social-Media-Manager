'use client';

import type { AgentStatus } from '@/lib/types';

interface HeaderProps {
  status: AgentStatus;
}

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; dotClass: string; textClass: string }
> = {
  idle:    { label: 'Idle',    dotClass: 'bg-bainsa-white/30', textClass: 'text-bainsa-muted' },
  running: { label: 'Running', dotClass: 'bg-bainsa-orange animate-pulse', textClass: 'text-bainsa-orange' },
  success: { label: 'Done',    dotClass: 'bg-green-400',        textClass: 'text-green-400' },
  error:   { label: 'Error',   dotClass: 'bg-red-400',          textClass: 'text-red-400' },
};

export default function Header({ status }: HeaderProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <header className="sticky top-0 z-50 border-b border-bainsa-border bg-bainsa-black/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">

        {/* Wordmark */}
        <div className="flex items-center gap-3">
          {/* Corner-element logo mark */}
          <div className="relative h-7 w-7 flex-shrink-0">
            <span
              className="absolute top-0 left-0 h-3 w-3 border-l-2 border-t-2"
              style={{ borderColor: '#2740eb' }}
            />
            <span
              className="absolute bottom-0 right-0 h-3 w-3 border-r-2 border-b-2"
              style={{ borderColor: '#fe6203' }}
            />
          </div>

          <div className="flex flex-col leading-none">
            <span className="font-heading text-lg font-semibold tracking-widest text-bainsa-white uppercase">
              BAINSA
            </span>
            <span className="font-body text-[10px] tracking-widest text-bainsa-muted uppercase">
              Social Media Dashboard
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${cfg.dotClass}`} />
          <span className={`font-mono text-xs tracking-widest uppercase ${cfg.textClass}`}>
            Agent B · {cfg.label}
          </span>
        </div>
      </div>
    </header>
  );
}
