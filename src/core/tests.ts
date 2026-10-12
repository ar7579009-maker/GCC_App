import type { AppState, PwResult, PwTest } from './types';

export type TestStatus = 'attempted' | 'upcoming' | 'expired' | 'open';

export interface Score {
  score: number;
  max: number;
  manual: boolean;
}

/** A hand-entered score wins over the synced one. */
export function scoreOf(state: AppState, test: PwTest, results: Record<string, PwResult>): Score | null {
  const m = state.ts[test.id];
  if (m && m.score !== null && m.max) return { score: m.score, max: m.max, manual: true };
  const r = results[test.id];
  return r ? { score: r.score, max: r.max, manual: false } : null;
}

export function testStatus(test: PwTest, score: Score | null, today: string): TestStatus {
  if (score) return 'attempted';
  const start = (test.start ?? '').slice(0, 10);
  const end = (test.end ?? '').slice(0, 10);
  if (start && start > today) return 'upcoming';
  if (end && end < today) return 'expired';
  return 'open';
}
