import type { AppState } from './types';
import { DEFAULT_ORDER } from './plan';

/** Starting values. Dates are overridable; today is the real date unless set. */
export const defaultState = (): AppState => ({
  today: '',
  planStart: '',
  deadline: '2026-12-31',
  exam: '2027-02-06',
  target: 65,
  lanes: 3,
  daily: 12,
  shares: '50,30,20',
  speed: 1.25,
  sunOff: false,
  leftover: true,
  w: { lec: 30, dpp: 15, r1: 10, r2: 10, pyq: 15, test: 20 },
  order: DEFAULT_ORDER.map((o) => ({ ...o })),
  marks: {},
  lec: {},
  lecAt: {},
  pyq: {},
  ts: {},
  sessions: [],
  tmMin: 60,
  tGA: 60,
  tMaths: 90,
  tCore: 180,
});
