import { addDays, blockOfName, buildModel, defaultState, jobs, parseShares, simulate, todayQueue } from '../../src/core';
import { pwSample } from '../fixtures/pw-sample';

describe('addDays', () => {
  it('moves across a month boundary', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});

describe('blockOfName', () => {
  it('sorts subjects into GA, Maths and Core', () => {
    expect(blockOfName('Verbal Aptitude')).toBe('GA');
    expect(blockOfName('Linear Algebra')).toBe('Maths');
    expect(blockOfName('Compiler Design')).toBe('Core');
  });
});

describe('parseShares', () => {
  it('ignores blanks and zeros', () => {
    expect(parseShares('50, 30 ,0,20')).toEqual([50, 30, 20]);
  });
});

describe('simulate', () => {
  const model = buildModel(pwSample);
  const state = defaultState();
  state.today = '2026-10-12';

  it('finishes every subject and reports the last study day', () => {
    const js = jobs(state, model);
    const r = simulate(js, { lanes: 2, daily: 4, shares: [50, 50], sunOff: false, leftover: true, start: '2026-10-12' });
    expect(r.done).toBe(true);
    expect(r.finish).not.toBeNull();
  });

  it('spends no more than the daily hours on any day', () => {
    const js = jobs(state, model);
    const r = simulate(js, { lanes: 3, daily: 2, shares: [], sunOff: false, leftover: false, start: '2026-10-12' });
    for (const d of r.days) {
      const total = d.alloc.reduce((a, x) => a + x.hours, 0);
      expect(total).toBeLessThanOrEqual(2 + 1e-9);
    }
  });

  it('gives no hours on a Sunday when Sunday is off', () => {
    const js = jobs(state, model);
    const r = simulate(js, { lanes: 1, daily: 3, shares: [], sunOff: true, leftover: true, start: '2026-10-11' });
    const sundays = r.days.filter((d) => new Date(d.date + 'T12:00:00').getDay() === 0);
    expect(sundays.length).toBeGreaterThan(0);
    sundays.forEach((d) => expect(d.alloc).toHaveLength(0));
  });
});

describe('todayQueue', () => {
  it('lists pending lectures only, never ticked ones', () => {
    const model = buildModel(pwSample);
    const state = defaultState();
    state.today = '2026-10-12';
    state.planStart = '2026-10-12';
    const q = todayQueue(state, model);
    expect(q.length).toBeGreaterThan(0);
    expect(q.some((x) => x.title === 'DFA 01')).toBe(false); // done in the sync file
  });
});
