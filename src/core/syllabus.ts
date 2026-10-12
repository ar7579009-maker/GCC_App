import type { AppState, Subject, PwFile, Lecture, Chapter } from './types';

/** Lower-case, punctuation-free key used to match names across files. */
export const nk = (v: string | undefined | null): string =>
  String(v ?? '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();

const SKIP = /^(notices|starter kit)$/i;

/** Builds the subject → chapter → lecture model from a sync file. One lecture per name and length. */
export function buildModel(pw: PwFile): Subject[] {
  const subs = new Map<string, { name: string; key: string; chapters: Map<string, Chapter> }>();
  for (const ps of pw.subjects ?? []) {
    if (!ps.name || SKIP.test(ps.name.trim())) continue;
    const sk = nk(ps.name);
    const sub = subs.get(sk) ?? { name: ps.name, key: sk, chapters: new Map<string, Chapter>() };
    subs.set(sk, sub);
    for (const pc of ps.chapters ?? []) {
      const ck = nk(pc.name);
      const ch = sub.chapters.get(ck) ?? { name: pc.name, key: ck, lectures: [] as Lecture[] };
      sub.chapters.set(ck, ch);
      const seen = new Map(ch.lectures.map((l) => [l.key, l] as const));
      for (const pl of pc.lectures ?? []) {
        const lk = nk(pl.title) + '|' + Math.round((pl.durSec ?? 0) / 60);
        const existing = seen.get(lk);
        if (!existing) {
          const l: Lecture = { key: lk, title: pl.title, durSec: pl.durSec ?? 0, pwDone: pl.state === 'done' };
          ch.lectures.push(l);
          seen.set(lk, l);
        } else if (pl.state === 'done') existing.pwDone = true;
      }
    }
  }
  return [...subs.values()].map((s) => ({
    name: s.name,
    key: s.key,
    chapters: [...s.chapters.values()],
  }));
}

export const lectureId = (s: Subject, c: Chapter, l: Lecture): string => `${s.key}|${c.key}|${l.key}`;

/** A lecture is done if the user ticked it here; otherwise it follows the sync file. */
export function isDone(state: AppState, s: Subject, c: Chapter, l: Lecture): boolean {
  const v = state.lec[lectureId(s, c, l)];
  return v && v.done !== undefined ? !!v.done : l.pwDone;
}

export const hasFlag = (state: AppState, s: Subject, c: Chapter, l: Lecture, f: 'r1' | 'r2'): boolean =>
  !!state.lec[lectureId(s, c, l)]?.[f];

export interface SubjectStats {
  n: number;
  dn: number;
  pct: number;
}

/** Weighted progress for one subject (lectures, R1, R2, PYQ). Same weights as the Windows app. */
export function subjectStats(state: AppState, s: Subject): SubjectStats {
  const ls = s.chapters.flatMap((c) => c.lectures.map((l) => ({ c, l })));
  const n = ls.length;
  const dn = ls.filter((x) => isDone(state, s, x.c, x.l)).length;
  const share = (count: number) => (n ? (count / n) * 100 : null);
  const r1 = share(ls.filter((x) => hasFlag(state, s, x.c, x.l, 'r1')).length);
  const r2 = share(ls.filter((x) => hasFlag(state, s, x.c, x.l, 'r2')).length);
  const pyqRows = s.chapters.map((c) => state.pyq[c.key] ?? { done: 0, total: 0 });
  const pyqTotal = pyqRows.reduce((a, p) => a + (+p.total || 0), 0);
  const pyq = pyqTotal
    ? (pyqRows.reduce((a, p) => a + (+p.done || 0), 0) / pyqTotal) * 100
    : null;

  const parts: Array<[number, number | null]> = [
    [state.w.lec, n ? (dn / n) * 100 : null],
    [state.w.r1, r1],
    [state.w.r2, r2],
    [state.w.pyq, pyq],
  ];
  const usable = parts.filter((p): p is [number, number] => p[1] !== null && p[0] > 0);
  const total = usable.reduce((a, p) => a + p[0], 0);
  const pct = total ? Math.round(usable.reduce((a, p) => a + p[0] * p[1], 0) / total) : 0;
  return { n, dn, pct };
}

export function overall(state: AppState, model: Subject[]): { n: number; dn: number; pct: number } {
  let n = 0;
  let dn = 0;
  for (const s of model) {
    for (const c of s.chapters) {
      for (const l of c.lectures) {
        n++;
        if (isDone(state, s, c, l)) dn++;
      }
    }
  }
  return { n, dn, pct: n ? Math.round((dn / n) * 100) : 0 };
}
