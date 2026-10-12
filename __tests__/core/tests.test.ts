import { scoreOf, testStatus, defaultState } from '../../src/core';
import { pwSample } from '../fixtures/pw-sample';

const results = Object.fromEntries((pwSample.results ?? []).map((r) => [r.testId, r]));

describe('scoreOf', () => {
  it('uses the synced result when nothing was entered', () => {
    const s = scoreOf(defaultState(), pwSample.tests![0], results);
    expect(s).toEqual({ score: 60, max: 100, manual: false });
  });

  it('prefers a hand-entered score', () => {
    const state = defaultState();
    state.ts.t1 = { score: 75, max: 100 };
    expect(scoreOf(state, pwSample.tests![0], results)).toEqual({ score: 75, max: 100, manual: true });
  });
});

describe('testStatus', () => {
  const [t1, t2, t3] = pwSample.tests!;
  it('is attempted once it has a score', () => {
    expect(testStatus(t1, { score: 60, max: 100, manual: false }, '2026-10-12')).toBe('attempted');
  });
  it('is upcoming before its start date', () => {
    expect(testStatus(t2, null, '2026-10-12')).toBe('upcoming');
  });
  it('is expired after its end date', () => {
    expect(testStatus(t3, null, '2026-10-12')).toBe('expired');
  });
});
