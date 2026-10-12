import { useMemo } from 'react';
import { AppState, PwFile, Subject, buildModel } from '../core';

/** State with today and plan start filled in. */
export type Effective = AppState & { today: string; planStart: string };

const pad = (n: number) => String(n).padStart(2, '0');

/** Today on this device, as YYYY-MM-DD. */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Fills in today and plan start, unless the user has set an override. */
export function effectiveState(state: AppState): Effective {
  const today = state.today || localToday();
  return { ...state, today, planStart: state.planStart || today };
}

export function useEffective(state: AppState): Effective {
  return useMemo(() => effectiveState(state), [state]);
}

export function useModel(pw: PwFile | null): Subject[] {
  return useMemo(() => (pw ? buildModel(pw) : []), [pw]);
}
