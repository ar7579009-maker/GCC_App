import { hms, parseTime, shownSeconds } from '../../src/core';

describe('hms', () => {
  it('formats seconds as hh:mm:ss', () => {
    expect(hms(0)).toBe('00:00:00');
    expect(hms(3725)).toBe('01:02:05');
  });
});

describe('parseTime', () => {
  it('reads all three input styles', () => {
    expect(parseTime('00:25:00')).toBe(1500);
    expect(parseTime('25:00')).toBe(1500);
    expect(parseTime('25')).toBe(1500);
  });
  it('caps at ten hours', () => {
    expect(parseTime('99:00:00')).toBe(36000);
  });
});

describe('shownSeconds', () => {
  it('counts down for a set length and up for a stopwatch', () => {
    expect(shownSeconds(1500, 600)).toBe(900);
    expect(shownSeconds(0, 600)).toBe(600);
    expect(shownSeconds(600, 900)).toBe(0);
  });
});
