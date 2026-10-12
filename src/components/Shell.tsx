import React, { useState } from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { HomeScreen } from '../screens/Home';
import { SyllabusScreen } from '../screens/Syllabus';
import { TestsScreen } from '../screens/Tests';
import { PlanScreen } from '../screens/Plan';
import { SettingsScreen } from '../screens/Settings';
import { usePalette, space } from '../theme';

const TABS = [
  { key: 'home', label: 'Home', view: HomeScreen },
  { key: 'syllabus', label: 'Syllabus', view: SyllabusScreen },
  { key: 'tests', label: 'Tests', view: TestsScreen },
  { key: 'plan', label: 'Plan', view: PlanScreen },
  { key: 'settings', label: 'Settings', view: SettingsScreen },
] as const;

export function Shell() {
  const p = usePalette();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('home');
  const Current = TABS.find((t) => t.key === tab)!.view;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm }}>
        <Text style={{ color: p.mu, fontSize: 16, letterSpacing: 1, textTransform: 'uppercase' }}>GATE CSE 2027</Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: space.md }}>
        <Current />
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: p.pn, borderTopWidth: 1, borderTopColor: p.ln }}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={{ flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderTopWidth: 2, borderTopColor: on ? p.ac : 'transparent' }}
            >
              <Text style={{ color: on ? p.ac : p.mu, fontWeight: '600', fontSize: 13 }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
