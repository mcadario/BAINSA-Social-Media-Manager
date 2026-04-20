/**
 * Global singleton that holds the current agent run state and log buffer.
 *
 * Uses `globalThis` so state survives Next.js hot-module reloads in dev.
 * This is intentional: we want the SSE stream to continue across HMR cycles.
 */

import type { ChildProcess } from 'child_process';
import type { LogEntry, LogType, AgentStatus } from './types';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface InternalState {
  process: ChildProcess | null;
  status: AgentStatus;
  startTime: string | null;
  endTime: string | null;
  exitCode: number | null;
  lastOutputFile: string | null;
  logs: LogEntry[];
  logIdCounter: number;
  /** Incremented every time a new run starts — lets SSE clients detect session change */
  runGeneration: number;
  /** Cancellation flag for the mock run async chain */
  mockCancelled: boolean;
  /** SSE listener callbacks registered by open /api/logs connections */
  listeners: Set<(entry: LogEntry) => void>;
}

// ---------------------------------------------------------------------------
// Singleton bootstrap
// ---------------------------------------------------------------------------

const _global = globalThis as typeof globalThis & {
  __bainsaAgentState?: InternalState;
};

function createInitialState(): InternalState {
  return {
    process: null,
    status: 'idle',
    startTime: null,
    endTime: null,
    exitCode: null,
    lastOutputFile: null,
    logs: [],
    logIdCounter: 0,
    runGeneration: 0,
    mockCancelled: false,
    listeners: new Set(),
  };
}

const state: InternalState =
  _global.__bainsaAgentState ?? (_global.__bainsaAgentState = createInitialState());

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getState() {
  return {
    status: state.status,
    startTime: state.startTime,
    endTime: state.endTime,
    exitCode: state.exitCode,
    lastOutputFile: state.lastOutputFile,
    logs: [...state.logs],
    runGeneration: state.runGeneration,
  };
}

export function getRunGeneration() {
  return state.runGeneration;
}

export function cancelMock() {
  state.mockCancelled = true;
}

export function isMockCancelled() {
  return state.mockCancelled;
}

export function getProcess() {
  return state.process;
}

export function setProcess(proc: ChildProcess | null) {
  state.process = proc;
}

export function setStatus(status: AgentStatus) {
  state.status = status;
}

export function setStartTime(t: string | null) {
  state.startTime = t;
}

export function setEndTime(t: string | null) {
  state.endTime = t;
}

export function setExitCode(code: number | null) {
  state.exitCode = code;
}

export function setLastOutputFile(filename: string | null) {
  state.lastOutputFile = filename;
}

export function addLog(message: string, type: LogType): LogEntry {
  const entry: LogEntry = {
    id: state.logIdCounter++,
    timestamp: new Date().toISOString(),
    message,
    type,
  };
  state.logs.push(entry);
  // Notify all live SSE listeners
  state.listeners.forEach((fn) => {
    try { fn(entry); } catch { /* client disconnected */ }
  });
  return entry;
}

export function clearLogs() {
  state.logs = [];
  state.logIdCounter = 0;
  state.runGeneration += 1;   // tells SSE clients a fresh run has started
  state.mockCancelled = false; // reset cancel flag for new run
}

export function addListener(fn: (entry: LogEntry) => void) {
  state.listeners.add(fn);
}

export function removeListener(fn: (entry: LogEntry) => void) {
  state.listeners.delete(fn);
}

export function isRunning() {
  return state.status === 'running';
}
