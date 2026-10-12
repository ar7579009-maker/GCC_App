import { buildModel, isDone, nk, overall, subjectStats, lectureId } from '../../src/core';
import { defaultState } from '../../src/core';
import { pwSample } from '../fixtures/pw-sample';

describe('nk', () => {
  it('normalises names for matching', () => {
    expect(nk('Data Structure & Programming')).toBe('data structure and programming');
    expect(nk('  C  Programming!! ')).toBe('c programming');
  });
});

describe('buildModel', () => {
  const model = buildModel(pwSample);

  it('skips the notices subject', () => {
    expect(model.map((s) => s.name)).toEqual(['Theory of Computation', 'General Aptitude', 'Linear Algebra']);
  });

  it('keeps every lecture with its length', () => {
    const toc = model[0];
    expect(toc.chapters[0].lectures.map((l) => l.title)).toEqual(['DFA 01', 'DFA 02', 'DFA 03']);
  });
});

describe('progress', () => {
  const model = buildModel(pwSample);
  const toc = model[0];

  it('uses the sync file state when the user has not ticked anything', () => {
    const state = defaultState();
    expect(isDone(state, toc, toc.chapters[0], toc.chapters[0].lectures[0])).toBe(true);
    expect(isDone(state, toc, toc.chapters[0], toc.chapters[0].lectures[1])).toBe(false);
  });

  it('lets a manual tick override the sync file', () => {
    const state = defaultState();
    const l = toc.chapters[0].lectures[0];
    state.lec[lectureId(toc, toc.chapters[0], l)] = { done: false };
    expect(isDone(state, toc, toc.chapters[0], l)).toBe(false);
  });

  it('computes a weighted subject percentage', () => {
    const state = defaultState();
    // lectures 1 of 3 (33.3%, weight 30) and R1/R2 at 0% (weights 10 + 10), PYQ has no data:
    // (33.3 × 30 + 0 × 10 + 0 × 10) / 50 = 20
    expect(subjectStats(state, toc)).toEqual({ n: 3, dn: 1, pct: 20 });
  });

  it('computes overall coverage across subjects', () => {
    const state = defaultState();
    expect(overall(state, model)).toEqual({ n: 6, dn: 1, pct: 17 });
  });
});
