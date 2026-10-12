import type { AppState, Session } from './types';

/** Row for the `sessions` table, the same shape the Windows app writes. */
export function sessionRow(userId: string, s: Session, deleted: boolean, nowIso: string) {
  return {
    user_id: userId,
    id: s.id,
    subject: s.subject,
    block: s.block,
    day: s.day,
    start_ms: Date.parse(s.day + 'T12:00:00'),
    seconds: Math.max(0, Math.round(s.seconds)),
    mode: s.mode === 'stopwatch' ? 'up' : 'down',
    updated_at: nowIso,
    deleted,
  };
}

/** Row for the `lec_state` table. */
export function lectureRow(userId: string, key: string, state: AppState, fallbackIso: string) {
  const v = state.lec[key] ?? {};
  return {
    user_id: userId,
    lec_key: key,
    done: v.done === undefined ? null : !!v.done,
    r1: !!v.r1,
    r2: !!v.r2,
    dpp_done: false,
    note_rel: null,
    updated_at: state.lecAt[key] ?? fallbackIso,
    deleted: false,
  };
}

/** Newer change wins, as in the Windows app. */
export const isNewer = (remoteIso: string, localIso?: string): boolean =>
  !localIso || Date.parse(remoteIso) > Date.parse(localIso);
