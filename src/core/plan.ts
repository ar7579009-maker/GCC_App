import type { AppState, RuleId, Subject } from './types';
import { isDone, nk } from './syllabus';

export const DEFAULT_MARKS: Record<string, number> = {
  'theory of computation': 7.5, 'database management system': 8, 'compiler design': 5,
  'operating systems': 9, 'general aptitude': 10, 'data structure and programming': 6,
  'discrete mathematics': 6, algorithms: 6.5, 'probability and statistics': 3, 'c programming': 3,
  'computer organization and architecture': 8, 'calculus and optimization': 2, 'computer network': 8.5,
  'linear algebra': 2, 'digital logic': 5, 'verbal aptitude': 5, 'fundamental of c language': 1.5,
  'basics of computer system': 1.5, 'foundation of engineering math': 1.5,
};

export const DEFAULT_ORDER = [
  { id: 'pinned' as RuleId, on: true },
  { id: 'mph' as RuleId, on: true },
  { id: 'marks' as RuleId, on: false },
  { id: 'short' as RuleId, on: false },
  { id: 'due' as RuleId, on: false },
  { id: 'block' as RuleId, on: false },
];

export type Block = 'GA' | 'Maths' | 'Core';

/** Same block rule as the Windows app: GA, Maths, or Core, decided by subject name. */
export function blockOfName(name: string): Block {
  const k = nk(name);
  if (/^(general aptitude|verbal aptitude)$/.test(k)) return 'GA';
  if (/(discrete|linear algebra|calculus|engineering math|probability)/.test(k)) return 'Maths';
  return 'Core';
}

export const markOf = (state: AppState, s: Subject): number =>
  s.key in state.marks ? state.marks[s.key] : (DEFAULT_MARKS[nk(s.name)] ?? 1);

export interface Job {
  key: string;
  name: string;
  hours: number;
  marks: number;
  block: Block;
}

function mixBlocks(list: Job[]): Job[] {
  const groups: Record<Block, Job[]> = { GA: [], Maths: [], Core: [] };
  list.forEach((j) => groups[j.block].push(j));
  const names: Block[] = ['GA', 'Maths', 'Core'];
  const out: Job[] = [];
  for (let i = 0; out.length < list.length; i++) {
    const q = groups[names[i % 3]];
    if (q.length) out.push(q.shift()!);
  }
  return out;
}

/** The subjects still to study, in the order the rules choose. */
export function jobs(state: AppState, model: Subject[]): Job[] {
  const base: Job[] = model
    .map((s) => ({
      key: s.key,
      name: s.name,
      hours: pendingHours(state, s),
      marks: markOf(state, s),
      block: blockOfName(s.name),
    }))
    .filter((j) => j.hours > 0);

  const cmp: Record<string, (a: Job, b: Job) => number> = {
    mph: (a, b) => b.marks / b.hours - a.marks / a.hours,
    marks: (a, b) => b.marks - a.marks,
    short: (a, b) => a.hours - b.hours,
    due: () => 0,
    pinned: () => 0,
  };
  const keys = state.order.filter((o) => o.on && o.id in cmp).map((o) => o.id);
  let out = base.sort((a, b) => {
    for (const k of keys) {
      const c = cmp[k](a, b);
      if (c) return c;
    }
    return a.name.localeCompare(b.name);
  });
  if (state.order.some((o) => o.id === 'block' && o.on)) out = mixBlocks(out);
  return out;
}

/** Hours still to study for a subject, at the chosen watch speed. A lecture with no length counts as 2 h. */
export function pendingHours(state: AppState, s: Subject): number {
  const raw = s.chapters.flatMap((c) =>
    c.lectures
      .filter((l) => !isDone(state, s, c, l))
      .map((l) => (l.durSec ? l.durSec / 3600 : 2)),
  ).reduce((a, b) => a + b, 0);
  return raw / (state.speed || 1);
}

export interface Allocation {
  name: string;
  hours: number;
  share: number;
}
export interface DayPlan {
  date: string;
  off: boolean;
  alloc: Allocation[];
}
export interface SimOptions {
  lanes: number;
  daily: number;
  shares: number[];
  sunOff: boolean;
  leftover: boolean;
  start: string;
}
export interface SimResult {
  days: DayPlan[];
  finish: string | null;
  done: boolean;
}

export const addDays = (ymd: string, n: number): string => {
  const d = new Date(ymd + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Day-by-day plan: N subjects at a time, shares split the day, a finished subject frees its lane. */
export function simulate(js: Job[], o: SimOptions): SimResult {
  const queue = js.map((j) => ({ ...j, rem: j.hours }));
  const L = Math.min(4, Math.max(1, o.lanes || 1));
  const slots: Array<(typeof queue)[number] | null> = Array(L).fill(null);
  const sh = Array.from({ length: L }, (_, i) => (o.shares[i] > 0 ? o.shares[i] : 1));
  const out: DayPlan[] = [];
  let finish: string | null = null;
  for (let d = 0; (queue.length || slots.some(Boolean)) && d < 900; d++) {
    const date = addDays(o.start, d);
    const rec: DayPlan = { date, off: !!(o.sunOff && new Date(date + 'T12:00:00').getDay() === 0), alloc: [] };
    out.push(rec);
    if (rec.off) continue;
    let budget = o.daily || 0;
    const used = new Map<string, Allocation & { name: string }>();
    for (let pass = 0; pass < (o.leftover ? 6 : 1) && budget > 1e-9; pass++) {
      for (let i = 0; i < L; i++) if (slots[i] && slots[i]!.rem <= 1e-9) slots[i] = null;
      for (let i = 0; i < L; i++) if (!slots[i] && queue.length) slots[i] = queue.shift()!;
      const act = slots.map((j, i) => (j && j.rem > 1e-9 ? i : -1)).filter((i) => i >= 0);
      if (!act.length) break;
      const ws = act.reduce((a, i) => a + sh[i], 0);
      const room = budget;
      for (const i of act) {
        const j = slots[i]!;
        const use = Math.min((room * sh[i]) / ws, j.rem, budget);
        if (use > 1e-9) {
          j.rem -= use;
          budget -= use;
          const u = used.get(j.key) ?? { name: j.name, hours: 0, share: Math.round((sh[i] / ws) * 100) };
          u.hours += use;
          used.set(j.key, u);
        }
      }
    }
    rec.alloc = [...used.values()];
    if (rec.alloc.length) finish = date;
    for (let i = 0; i < L; i++) if (slots[i] && slots[i]!.rem <= 1e-9) slots[i] = null;
  }
  return { days: out, finish, done: !queue.length && !slots.some(Boolean) };
}

/** Parses the shares text ("50,30,20") into positive numbers. */
export const parseShares = (text: string): number[] =>
  String(text).split(/[,\s]+/).map(Number).filter((x) => x > 0);

export function planResult(state: AppState, model: Subject[]): { js: Job[]; r: SimResult } {
  const js = jobs(state, model);
  const r = simulate(js, {
    lanes: state.lanes,
    daily: state.daily,
    shares: parseShares(state.shares),
    sunOff: state.sunOff,
    leftover: state.leftover,
    start: state.planStart || state.today || '',
  });
  return { js, r };
}

/** Lectures for today: the pending lectures that today's hours cover, subject by subject. */
export function todayQueue(state: AppState, model: Subject[]): Array<{ id: string; title: string; subj: string; hours: number }> {
  const { r } = planResult(state, model);
  const day = r.days[0];
  if (!day) return [];
  const out: Array<{ id: string; title: string; subj: string; hours: number }> = [];
  for (const a of day.alloc) {
    const s = model.find((x) => x.name === a.name);
    if (!s) continue;
    let need = a.hours;
    for (const c of s.chapters) {
      for (const l of c.lectures) {
        if (need <= 1e-9) break;
        if (isDone(state, s, c, l)) continue;
        const h = (l.durSec ? l.durSec / 3600 : 2) / (state.speed || 1);
        out.push({ id: `${s.key}|${c.key}|${l.key}`, title: l.title, subj: s.name, hours: h });
        need -= h;
      }
    }
  }
  return out;
}


/** Days from the day after the last study day up to the exam. Null while the plan is not finished. */
export function revisionDays(finish: string | null, exam: string, done: boolean): number | null {
  if (!done || !finish) return null;
  const from = addDays(finish, 1);
  const ms = new Date(exam + 'T12:00:00').getTime() - new Date(from + 'T12:00:00').getTime();
  return Math.max(0, Math.round(ms / 864e5));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to + 'T12:00:00').getTime() - new Date(from + 'T12:00:00').getTime()) / 864e5);
}
