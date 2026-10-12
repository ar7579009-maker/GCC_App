import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, PwFile, Session, defaultState } from '../core';

const KEY = 'gcc.state.v1';
const PW_KEY = 'gcc.pw.v1';

export interface Store {
  ready: boolean;
  state: AppState;
  pw: PwFile | null;
  update: (patch: Partial<AppState>) => void;
  toggleLecture: (id: string, currentlyDone: boolean) => void;
  toggleFlag: (id: string, flag: 'r1' | 'r2') => void;
  setPyq: (chapterKey: string, done: number, total: number) => void;
  setTestScore: (testId: string, score: number | null, max: number | null) => void;
  addSession: (s: Omit<Session, 'id'>) => void;
  deleteSession: (id: string) => void;
  importPw: (pw: PwFile) => void;
  replaceState: (s: AppState) => void;
}

const Ctx = createContext<Store | null>(null);

/** Keeps the whole app state on the device; every change is written straight away. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState());
  const [pw, setPw] = useState<PwFile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(PW_KEY)]);
        if (s) setState({ ...defaultState(), ...JSON.parse(s) });
        if (p) setPw(JSON.parse(p));
      } catch {
        // A damaged save falls back to the defaults rather than blocking the app.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const save = useCallback((next: AppState) => {
    setState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const stamp = () => new Date().toISOString();

  const store: Store = useMemo(
    () => ({
      ready,
      state,
      pw,
      update: (patch) => save({ ...state, ...patch }),
      toggleLecture: (id, currentlyDone) => {
        const cur = state.lec[id] ?? {};
        const done = !currentlyDone;
        save({ ...state, lec: { ...state.lec, [id]: { ...cur, done } }, lecAt: { ...state.lecAt, [id]: stamp() } });
      },
      toggleFlag: (id, flag) => {
        const cur = state.lec[id] ?? {};
        save({ ...state, lec: { ...state.lec, [id]: { ...cur, [flag]: !cur[flag] } }, lecAt: { ...state.lecAt, [id]: stamp() } });
      },
      setPyq: (chapterKey, done, total) =>
        save({ ...state, pyq: { ...state.pyq, [chapterKey]: { done: Math.max(0, done), total: Math.max(0, total) } } }),
      setTestScore: (testId, score, max) => {
        const next = { ...state.ts };
        if (score === null && max === null) delete next[testId];
        else next[testId] = { score, max };
        save({ ...state, ts: next });
      },
      addSession: (s) => save({ ...state, sessions: [...state.sessions, { ...s, id: 's' + Date.now() }] }),
      deleteSession: (id) => save({ ...state, sessions: state.sessions.filter((x) => x.id !== id) }),
      importPw: (file) => {
        setPw(file);
        AsyncStorage.setItem(PW_KEY, JSON.stringify(file)).catch(() => undefined);
      },
      replaceState: (s) => save(s),
    }),
    [ready, state, pw, save],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
