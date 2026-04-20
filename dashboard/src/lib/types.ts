// ---------------------------------------------------------------------------
// Agent B output types
// ---------------------------------------------------------------------------

export interface Slide {
  slide_number: number;
  hook: string;
  body: string;
  cta: string;
  visual_direction: string;
  source_topic_headline: string;
}

export interface StoryOutput {
  slides: Slide[];
}

// ---------------------------------------------------------------------------
// Output file metadata
// ---------------------------------------------------------------------------

export interface OutputFile {
  filename: string;
  /** ISO timestamp parsed from the filename */
  timestamp: string;
  /** Human-readable date string */
  dateLabel: string;
  /** Number of slides in this output */
  slideCount: number;
}

// ---------------------------------------------------------------------------
// Log streaming
// ---------------------------------------------------------------------------

export type LogType = 'stdout' | 'stderr' | 'system';

export interface LogEntry {
  id: number;
  timestamp: string;   // ISO timestamp
  message: string;
  type: LogType;
}

// ---------------------------------------------------------------------------
// Agent run state (shared between client and server)
// ---------------------------------------------------------------------------

export type AgentStatus = 'idle' | 'running' | 'success' | 'error';

export interface AgentRunState {
  status: AgentStatus;
  startTime: string | null;
  endTime: string | null;
  exitCode: number | null;
  lastOutputFile: string | null;
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export interface RunAgentResponse {
  ok: boolean;
  message: string;
}

export interface OutputsResponse {
  files: OutputFile[];
}

export interface OutputDetailResponse {
  filename: string;
  data: StoryOutput;
}
