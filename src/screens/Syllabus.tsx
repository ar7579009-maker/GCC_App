import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useStore } from '../state/store';
import { useModel } from '../state/derived';
import { Bar, Card, Check, Muted, Pill } from '../components/ui';
import { hasFlag, isDone, lectureId, subjectStats } from '../core';
import { usePalette, space } from '../theme';

/** Accordion: opening one subject closes the others. */
export function SyllabusScreen() {
  const p = usePalette();
  const store = useStore();
  const model = useModel(store.pw);
  const [open, setOpen] = useState<string | null>(null);

  if (!model.length) return <Muted>Load a sync file in Settings to see your subjects.</Muted>;

  return (
    <ScrollView contentContainerStyle={{ gap: space.md }}>
      {model.map((s) => {
        const st = subjectStats(store.state, s);
        const isOpen = open === s.key;
        return (
          <Card key={s.key} style={{ padding: 0, overflow: 'hidden' }}>
            <Pressable
              onPress={() => setOpen(isOpen ? null : s.key)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              style={{ padding: space.lg }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ color: p.tx, fontSize: 17, fontWeight: '700', flex: 1, paddingRight: space.sm }}>{s.name}</Text>
                <Muted>{st.dn}/{st.n}</Muted>
              </View>
              <Bar pct={st.pct} ok={st.pct >= 80} />
            </Pressable>

            {isOpen &&
              s.chapters.map((c) => (
                <View key={c.key} style={{ paddingHorizontal: space.lg, paddingBottom: space.md }}>
                  <Text style={{ color: p.ac, fontWeight: '600', marginTop: space.sm }}>{c.name}</Text>
                  {c.lectures.map((l) => {
                    const id = lectureId(s, c, l);
                    const done = isDone(store.state, s, c, l);
                    return (
                      <View key={id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: p.ln }}>
                        <Check on={done} onPress={() => store.toggleLecture(id, done)} />
                        <Text numberOfLines={1} style={{ flex: 1, color: p.tx, fontSize: 15, marginRight: space.sm }}>{l.title}</Text>
                        <Pill label="R1" on={hasFlag(store.state, s, c, l, 'r1')} onPress={() => store.toggleFlag(id, 'r1')} />
                        <View style={{ width: 6 }} />
                        <Pill label="R2" on={hasFlag(store.state, s, c, l, 'r2')} onPress={() => store.toggleFlag(id, 'r2')} />
                      </View>
                    );
                  })}
                </View>
              ))}
          </Card>
        );
      })}
    </ScrollView>
  );
}
