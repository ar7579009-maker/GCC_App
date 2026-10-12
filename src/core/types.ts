// Shapes of the PW sync file (pw-sync-latest.json) and the app's own state.

export interface PwLecture {
  title: string;
  durSec?: number;
  state?: 'done' | 'partial' | 'unreleased' | string;
}
export interface PwChapter {
  name: string;
  lectures?: PwLecture[];
}
export interface PwSubject {
  name: string;
  chapters?: PwChapter[];
}
export interface PwTest {
  id: string;
  name: string;
  type?: string;
  start?: string;
  end?: string;
  marks?: number;
}
export interface PwResult {
  testId: string;
  score: number;
  max: number;
}
export interface PwFile {
  updated?: string;
  subjects?: PwSubject[];
  tests?: PwTest[];
  results?: PwResult[];
}

export interface Lecture {
  key: string;
  title: string;
  durSec: number;
  pwDone: boolean;
}
export interface Chapter {
  name: string;
  key: string;
  lectures: Lecture[];
}
export interface Subject {
  name: string;
  key: string;
  chapters: Chapter[];
}

export interface Weights {
  lec: number;
  dpp: number;
  r1: number;
  r2: number;
  pyq: number;
  test: number;
}

export type RuleId = 'pinned' | 'mph' | 'marks' | 'short' | 'due' | 'block';
export interface OrderRule {
  id: RuleId;
  on: boolean;
}

/** Everything the user can change, persisted on the device. */
export interface AppState {
  today?: string;          // override; empty means the real date
  planStart?: string;      // override; empty means today
  deadline: string;
  exam: string;
  target: number;
  lanes: number;
  daily: number;
  shares: string;
  speed: number;
  sunOff: boolean;
  leftover: boolean;
  w: Weights;
  order: OrderRule[];
  marks: Record<string, number>;     // subject key -> marks
  lec: Record<string, { done?: boolean; r1?: boolean; r2?: boolean }>;
  lecAt: Record<string, string>;     // lecture key -> ISO time of last change (for sync)
  pyq: Record<string, { done: number; total: number }>;
  ts: Record<string, { score: number | null; max: number | null }>;   // hand-entered test scores
  sessions: Session[];
  tmMin: number;           // minimum seconds to save a session
  tGA: number;
  tMaths: number;
  tCore: number;
}

export interface Session {
  id: string;
  subject: string;
  block: 'GA' | 'Maths' | 'Core';
  day: string;             // YYYY-MM-DD
  seconds: number;
  mode: 'countdown' | 'stopwatch';
  finished: boolean;
}
