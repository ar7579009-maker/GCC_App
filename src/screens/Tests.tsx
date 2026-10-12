import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useStore } from '../state/store';
import { Card, Field, Muted, Pill, Stat } from '../components/ui';
import { scoreOf, testStatus, PwResult, PwTest } from '../core';
import { useEffective } from '../state/derived';
import { usePalette, space } from '../theme';

const FILTERS = ['all', 'attempted', 'open', 'upcoming', 'expired'] as const;
type Filter = (typeof FILTERS)[number];

export function TestsScreen() {
  const p = usePalette();
  const store = useStore();
  const eff = useEffective(store.state);
  const [filter, setFilter] = useState<Filter>('all');

  const results: Record<string, PwResult> = useMemo(
    () => Object.fromEntries((store.pw?.results ?? []).map((r) => [r.testId, r])),
    [store.pw],
  );

  const rows = useMemo(
    () =>
      (store.pw?.tests ?? []).map((t: PwTest) => {
        const sc = scoreOf(store.state, t, results);
        return { t, sc, status: testStatus(t, sc, eff.today) };
      }),
    [store.pw, store.state, results, eff.today],
  );

  if (!store.pw) return <Muted>Load a sync file in Settings to see your tests.</Muted>;

  const got = rows.filter((r) => r.sc);
  const avg = got.length ? got.reduce((a, r) => a + (r.sc!.score / r.sc!.max) * 100, 0) / got.length : null;
  const shown = rows.filter((r) => filter === 'all' || r.status === filter);

  return (
    <ScrollView contentContainerStyle={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={`${got.length}/${rows.length}`} label="attempted" />
        <Stat value={avg === null ? '–' : `${avg.toFixed(0)}%`} label="average" />
        <Stat value={avg === null ? '–' : ((avg * store.state.w.test) / 100).toFixed(1)} label={`marks of ${store.state.w.test}`} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {FILTERS.map((f) => (
          <Pill key={f} label={f[0].toUpperCase() + f.slice(1)} on={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      {shown.map(({ t, sc, status }) => (
        <Card key={t.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: p.tx, fontSize: 16 }}>{t.name}</Text>
            <Muted style={{ fontSize: 12 }}>{(t.end ?? '').slice(0, 10)} · {status}</Muted>
          </View>
          <Field
            keyboardType="decimal-pad"
            placeholder="score"
            defaultValue={sc && sc.score !== null ? String(sc.score) : ''}
            onEndEditing={(e) => {
              const v = e.nativeEvent.text.trim();
              if (v === '') return store.setTestScore(t.id, null, null);
              store.setTestScore(t.id, +v, sc?.max ?? t.marks ?? 100);
            }}
            style={{ width: 84 }}
          />
          <Muted>/</Muted>
          <Field
            keyboardType="number-pad"
            defaultValue={String(sc?.max ?? t.marks ?? '')}
            onEndEditing={(e) => {
              const v = +e.nativeEvent.text || null;
              store.setTestScore(t.id, sc?.score ?? null, v);
            }}
            style={{ width: 70 }}
          />
        </Card>
      ))}
    </ScrollView>
  );
}
