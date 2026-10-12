import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useStore } from '../state/store';
import { useEffective, useModel } from '../state/derived';
import { Card, Display, Field, Muted, Pill, Stat } from '../components/ui';
import { planResult, revisionDays } from '../core';
import { usePalette, space } from '../theme';

const SEG_COLORS = ['#2b3a33'];

export function PlanScreen() {
  const p = usePalette();
  const store = useStore();
  const eff = useEffective(store.state);
  const model = useModel(store.pw);
  const plan = useMemo(() => (model.length ? planResult(eff, model) : null), [eff, model]);

  if (!plan) return <Muted>Load a sync file in Settings to see the plan.</Muted>;

  const { js, r } = plan;
  const rev = revisionDays(r.finish, eff.exam, r.done);
  const start = new Date(eff.planStart + 'T12:00:00').getTime();
  const end = new Date(eff.exam + 'T12:00:00').getTime();
  const at = (ymd: string) => Math.max(0, Math.min(100, ((new Date(ymd + 'T12:00:00').getTime() - start) / (end - start)) * 100));

  return (
    <ScrollView contentContainerStyle={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Card style={{ flex: 1 }}>
          <Display size={34}>{r.finish ? r.finish.slice(5) : '–'}</Display>
          <Muted>finish</Muted>
        </Card>
        <Card style={{ flex: 1 }}>
          <Display size={34}>{rev ?? '–'}</Display>
          <Muted>revision days</Muted>
        </Card>
      </View>

      <View style={{ height: 24, borderRadius: 6, overflow: 'hidden', backgroundColor: p.ln }}>
        <View style={{ width: `${at(r.finish ?? eff.exam)}%`, backgroundColor: SEG_COLORS[0] }} />
        <View style={{ width: 3, backgroundColor: p.bad, position: 'absolute', left: `${at(eff.deadline)}%`, top: 0, bottom: 0 }} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' }}>
        {[1, 2, 3, 4].map((n) => (
          <Pill key={n} label={String(n)} on={store.state.lanes === n} onPress={() => store.update({ lanes: n })} />
        ))}
        <View style={{ flex: 1 }} />
        <Field
          keyboardType="decimal-pad"
          defaultValue={String(store.state.daily)}
          onEndEditing={(e) => store.update({ daily: Math.max(0, +e.nativeEvent.text || 0) })}
          style={{ width: 64 }}
        />
        <Muted>h/day</Muted>
      </View>

      {js.map((j, i) => (
        <Card key={j.key} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md }}>
          <Text style={{ color: p.mu, width: 18 }}>{i + 1}</Text>
          <Text style={{ color: p.tx, fontSize: 16, flex: 1 }} numberOfLines={1}>{j.name}</Text>
          <Muted>{j.hours.toFixed(1)} h</Muted>
        </Card>
      ))}
    </ScrollView>
  );
}
