/** Seconds to "hh:mm:ss". */
export function hms(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** Accepts "hh:mm:ss", "mm:ss", or plain minutes. Returns seconds, capped at 10 hours. */
export function parseTime(text: string): number {
  const p = String(text).trim().split(':').map((x) => parseFloat(x) || 0);
  const sec =
    p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : p[0] * 60;
  return Math.max(0, Math.min(600 * 60, sec));
}

/** Countdown shows what is left; a stopwatch (length 0) shows elapsed time. */
export function shownSeconds(lengthS: number, elapsedS: number): number {
  return lengthS > 0 ? Math.max(0, lengthS - elapsedS) : elapsedS;
}
