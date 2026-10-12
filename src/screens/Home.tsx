import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useStore } from '../state/store';
import { useEffective, useModel } from '../state/derived';
import { Btn, Card, Display, Muted, Pill, Stat, Bar, Heading } from '../components/ui';
import { Session, blockOfName, daysBetween, hms, overall, planResult, shownSeconds, todayQueue } from '../core';
import { usePalette } from '../theme';
import { space } from '../theme';

const MODES = ['Learn', 'Practice', 'Revise'] as const;
const CHOICES = [1, 5, 25, 45, 90] as const;

/** Countdown or stopwatch that keeps time while the app is open. Background timing needs a foreground service (see README). */
function useTimer() {
  const [lengthS, setLengthS] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [startMs, setStartMs] = useState(0);
  const [before, setBefore] = useState(0);
  const [, force] = useState(0);

  const elapsed = before + (running ? Math.floor((Date.now() - startMs) / 1000) : 0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [running]);

  return {
    lengthS, setLengthS, running, elapsed, active: running || before > 0,
    start: () => { setStartMs(Date.now()); setRunning(true); },
    pause: () => { setBefore(elapsed); setRunning(false); },
    reset: () => { setBefore(0); setRunning(false); },
  };
}

export function HomeScreen() {
  const p = usePalette();
  const store = useStore();
  const eff = useEffective(store.state);
  const model = useModel(store.pw);
  const t = useTimer();
  const [mode, setMode] = useState<(typeof MODES)[number]>('Learn');
  const [subjIndex, setSubjIndex] = useState(0);
  const subject = model[subjIndex]?.name ?? '';

  const shown = shownSeconds(t.lengthS, t.elapsed);
  const isCountdown = t.lengthS > 0;

  // Countdown reaching zero stops and saves on its own.
  useEffect(() => {
    if (t.running && isCountdown && t.elapsed >= t.lengthS) stop(true);
  });

  function stop(finished: boolean) {
    const secs = isCountdown ? Math.min(t.elapsed, t.lengthS) : t.elapsed;
    if (secs >= store.state.tmMin && secs > 0) {
      store.addSession({
        subject, block: blockOfName(subject), day: eff.today, seconds: secs,
        mode: isCountdown ? 'countdown' : 'stopwatch', finished,
      });
    }
    t.reset();
  }

  const todaySessions = store.state.sessions.filter((s: Session) => s.day === eff.today);
  const sum = (b: Session['block']) => todaySessions.filter((s) => s.block === b).reduce((a, s) => a + s.seconds, 0);
  const allSec = todaySessions.reduce((a, s) => a + s.seconds, 0) + (t.running ? t.elapsed : 0);

  const ov = overall(store.state, model);
  const plan = useMemo(() => (model.length ? planResult(eff, model) : null), [eff, model]);
  const queue = useMemo(() => (model.length ? todayQueue(eff, model) : []), [eff, model]);

  return (
    <ScrollView contentContainerStyle={{ gap: space.md }}>
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.sm, flexWrap: 'wrap' }}>
          {MODES.map((m) => (
            <Pill key={m} label={m} on={mode === m} onPress={() => !t.active && setMode(m)} />
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {model.map((s, i) => (
            <Pill key={s.key} label={s.name} on={i === subjIndex} onPress={() => !t.active && setSubjIndex(i)} />
          ))}
        </ScrollView>

        <View style={{ alignItems: 'center', paddingVertical: space.sm }}>
          <Display size={72}>{hms(shown)}</Display>
          <Muted>{isCountdown ? 'countdown' : 'stopwatch'} · {mode}</Muted>
        </View>

        <View style={{ flexDirection: 'row', gap: space.sm, justifyContent: 'center' }}>
          {CHOICES.map((m) => (
            <Pill
              key={m}
              label={m === 1 ? 'stopwatch' : `${m} min`}
              on={(m === 1 ? 0 : m * 60) === t.lengthS}
              onPress={() => !t.active && t.setLengthS(m === 1 ? 0 : m * 60)}
            />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Btn label={t.running ? 'Pause' : t.active ? 'Resume' : 'Start'} primary onPress={() => (t.running ? t.pause() : t.start())} />
          <Btn label="Stop and save" onPress={() => stop(false)} disabled={!t.active} />
        </View>
        <Muted style={{ textAlign: 'center' }}>
          {subject ? `Saves to ${subject} (${blockOfName(subject)}) when it reaches ${store.state.tmMin} s or more.` : 'Load a sync file in Settings to pick a subject.'}
        </Muted>
      </Card>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={(sum('GA') / 3600).toFixed(1)} label="GA h" />
        <Stat value={(sum('Maths') / 3600).toFixed(1)} label="Maths h" />
        <Stat value={(sum('Core') / 3600).toFixed(1)} label="Core h" />
        <Stat value={(allSec / 3600).toFixed(1)} label="today h" />
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={daysBetween(eff.today, eff.deadline)} label="to deadline" />
        <Stat value={daysBetween(eff.today, eff.exam)} label="to exam" />
        <Stat value={plan?.r.finish ? plan.r.finish.slice(5) : '–'} label="plan finish" />
      </View>

      <Card>
        <Display size={36}>{ov.pct}%</Display>
        <Muted>covered · {ov.dn} of {ov.n} lectures</Muted>
        <Bar pct={ov.pct} ok={ov.pct >= 80} />
      </Card>

      <Heading>Today</Heading>
      {queue.length === 0 ? (
        <Muted>{model.length ? 'Nothing in the queue today.' : 'Load a sync file in Settings.'}</Muted>
      ) : (
        queue.map((q) => (
          <Card key={q.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: p.tx, fontSize: 16 }}>{q.title}</Text>
              <Muted>{q.subj} · {q.hours.toFixed(1)} h</Muted>
            </View>
            <Pressable
              onPress={() => store.toggleLecture(q.id, false)}
              accessibilityRole="button"
              style={{ backgroundColor: p.ac, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9 }}
            >
              <Text style={{ color: p.on, fontWeight: '600' }}>Done</Text>
            </Pressable>
          </Card>
        ))
      )}
    </ScrollView>
  );
}
