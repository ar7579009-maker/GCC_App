import { supabase } from './supabase';
import { AppState, isNewer, lectureRow, sessionRow } from '../core';

export interface CloudResult {
  ok: boolean;
  message: string;
}

export async function sendPin(email: string): Promise<CloudResult> {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  return error ? { ok: false, message: 'Could not send PIN: ' + error.message } : { ok: true, message: 'PIN sent to ' + email };
}

export async function verifyPin(email: string, token: string): Promise<CloudResult> {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error || !data.session) return { ok: false, message: 'PIN not accepted' };
  return { ok: true, message: 'Signed in as ' + email };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Sends every lecture tick and session to the cloud. Small enough to send in full. */
export async function pushAll(state: AppState, userId: string): Promise<CloudResult> {
  const now = new Date().toISOString();
  const lecRows = Object.keys(state.lec).map((k) => lectureRow(userId, k, state, now));
  const sessRows = state.sessions.map((s) => sessionRow(userId, s, false, now));
  try {
    if (lecRows.length) {
      const { error } = await supabase.from('lec_state').upsert(lecRows, { onConflict: 'user_id,lec_key' });
      if (error) throw error;
    }
    if (sessRows.length) {
      const { error } = await supabase.from('sessions').upsert(sessRows, { onConflict: 'user_id,id' });
      if (error) throw error;
    }
    return { ok: true, message: `Sent ${lecRows.length + sessRows.length} row(s)` };
  } catch (e) {
    return { ok: false, message: 'Send failed: ' + (e as Error).message };
  }
}

/**
 * Pulls changes made on other devices. The newer change wins, as in the Windows app.
 * Returns the merged state; the caller saves it.
 */
export async function pullAll(state: AppState, userId: string): Promise<{ state: AppState; result: CloudResult }> {
  const next: AppState = { ...state, lec: { ...state.lec }, lecAt: { ...state.lecAt }, sessions: [...state.sessions] };
  let changed = 0;
  try {
    const { data: lr, error: e1 } = await supabase.from('lec_state').select('*').eq('user_id', userId);
    if (e1) throw e1;
    for (const r of lr ?? []) {
      if (isNewer(r.updated_at, state.lecAt[r.lec_key])) {
        next.lec[r.lec_key] = { done: r.done === null ? undefined : !!r.done, r1: !!r.r1, r2: !!r.r2 };
        next.lecAt[r.lec_key] = r.updated_at;
        changed++;
      }
    }
    const { data: sr, error: e2 } = await supabase.from('sessions').select('*').eq('user_id', userId);
    if (e2) throw e2;
    for (const r of sr ?? []) {
      const have = next.sessions.some((x) => x.id === r.id);
      if (r.deleted) {
        if (have) {
          next.sessions = next.sessions.filter((x) => x.id !== r.id);
          changed++;
        }
      } else if (!have) {
        next.sessions.push({
          id: r.id, subject: r.subject, block: r.block ?? 'Core', day: r.day, seconds: r.seconds,
          mode: r.mode === 'up' ? 'stopwatch' : 'countdown', finished: false,
        });
        changed++;
      }
    }
    return { state: next, result: { ok: true, message: `Pulled ${changed} change(s)` } };
  } catch (e) {
    return { state, result: { ok: false, message: 'Pull failed: ' + (e as Error).message } };
  }
}

