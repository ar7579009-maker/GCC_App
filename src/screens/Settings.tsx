import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useStore } from '../state/store';
import { localToday } from '../state/derived';
import { Btn, Card, Field, Heading, Muted } from '../components/ui';
import { PwFile, parseShares } from '../core';
import { pullAll, pushAll, currentUserId, sendPin, signOut, verifyPin } from '../data/cloud';
import { usePalette, space } from '../theme';

const num = (v: string) => +v || 0;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm, borderTopWidth: 1, borderTopColor: p.ln }}>
      <Text style={{ color: p.mu, fontSize: 16, flex: 1 }}>{label}</Text>
      {children}
    </View>
  );
}

export function SettingsScreen() {
  const store = useStore();
  const s = store.state;
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [pinSent, setPinSent] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState<string | null>(null);

  async function importFile() {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
    if (res.canceled) return;
    try {
      const text = await new File(res.assets[0].uri).text();
      const pw = JSON.parse(text) as PwFile;
      if (!Array.isArray(pw.subjects)) throw new Error('no subjects');
      store.importPw(pw);
      setMsg('Loaded ' + res.assets[0].name);
    } catch {
      Alert.alert('Not a sync file', 'Pick the pw-sync-latest.json file from the PC.');
    }
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  async function syncNow() {
    const uid = await currentUserId();
    if (!uid) return setMsg('Sign in first.');
    const pushed = await pushAll(s, uid);
    const pulled = await pullAll(s, uid);
    store.replaceState(pulled.state);
    setMsg(`${pushed.message}. ${pulled.result.message}.`);
  }

  const today = localToday();
  const p = usePalette();

  return (
    <ScrollView contentContainerStyle={{ gap: space.md }}>
      <Heading>Dates</Heading>
      <Card>
        <Row label="Today (blank = real date)">
          <Field defaultValue={s.today ?? ''} placeholder={today} onEndEditing={(e) => store.update({ today: e.nativeEvent.text.trim() })} style={{ width: 130 }} />
        </Row>
        <Row label="Plan start">
          <Field defaultValue={s.planStart ?? ''} placeholder={today} onEndEditing={(e) => store.update({ planStart: e.nativeEvent.text.trim() })} style={{ width: 130 }} />
        </Row>
        <Row label="Syllabus deadline">
          <Field defaultValue={s.deadline} onEndEditing={(e) => store.update({ deadline: e.nativeEvent.text.trim() })} style={{ width: 130 }} />
        </Row>
        <Row label="Exam date">
          <Field defaultValue={s.exam} onEndEditing={(e) => store.update({ exam: e.nativeEvent.text.trim() })} style={{ width: 130 }} />
        </Row>
      </Card>

      <Heading>Targets and plan</Heading>
      <Card>
        <Row label="Target marks"><Field keyboardType="number-pad" defaultValue={String(s.target)} onEndEditing={(e) => store.update({ target: num(e.nativeEvent.text) })} /></Row>
        <Row label="Watch speed"><Field keyboardType="decimal-pad" defaultValue={String(s.speed)} onEndEditing={(e) => store.update({ speed: num(e.nativeEvent.text) || 1 })} /></Row>
        <Row label="Shares (50,30,20)"><Field defaultValue={s.shares} onEndEditing={(e) => store.update({ shares: e.nativeEvent.text })} style={{ width: 130 }} /></Row>
        <Row label="Sunday off"><Btn label={s.sunOff ? 'On' : 'Off'} onPress={() => store.update({ sunOff: !s.sunOff })} /></Row>
        <Row label="Leftover time"><Btn label={s.leftover ? 'On' : 'Off'} onPress={() => store.update({ leftover: !s.leftover })} /></Row>
        <Row label="Minimum seconds to save"><Field keyboardType="number-pad" defaultValue={String(s.tmMin)} onEndEditing={(e) => store.update({ tmMin: num(e.nativeEvent.text) })} /></Row>
        <Muted style={{ marginTop: space.sm }}>Shares currently: {parseShares(s.shares).join(' : ') || 'equal'}</Muted>
      </Card>

      <Heading>Weights (progress parts)</Heading>
      <Card>
        {(['lec', 'dpp', 'r1', 'r2', 'pyq', 'test'] as const).map((k) => (
          <Row key={k} label={{ lec: 'Lectures', dpp: 'DPPs', r1: 'Revision 1', r2: 'Revision 2', pyq: 'PYQ', test: 'Tests' }[k]}>
            <Field keyboardType="number-pad" defaultValue={String(s.w[k])} onEndEditing={(e) => store.update({ w: { ...s.w, [k]: num(e.nativeEvent.text) } })} />
          </Row>
        ))}
      </Card>

      <Heading>Sync file</Heading>
      <Card style={{ gap: space.md }}>
        <Muted>{store.pw ? `Loaded: ${store.pw.subjects?.length ?? 0} subjects, updated ${(store.pw.updated ?? '').slice(0, 16).replace('T', ' ')}` : 'No sync file loaded.'}</Muted>
        <Btn label="Choose pw-sync-latest.json" primary onPress={() => run(importFile)} disabled={busy} />
      </Card>

      <Heading>Cloud sign-in</Heading>
      <Card style={{ gap: space.md }}>
        {signedIn ? (
          <>
            <Text style={{ color: p.tx }}>Signed in as {signedIn}</Text>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Btn label="Sync now" primary disabled={busy} onPress={() => run(syncNow)} />
              <Btn label="Sign out" onPress={() => run(async () => { await signOut(); setSignedIn(null); setMsg('Signed out'); })} />
            </View>
          </>
        ) : pinSent ? (
          <>
            <Muted>PIN sent to {email}</Muted>
            <Field placeholder="PIN from email" keyboardType="number-pad" value={pin} onChangeText={setPin} style={{ textAlign: 'left', width: '100%' }} />
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Btn label="Verify PIN" primary disabled={busy || pin.length < 6} onPress={() => run(async () => {
                const r = await verifyPin(email, pin.trim());
                setMsg(r.message);
                if (r.ok) { setSignedIn(email); setPinSent(false); }
              })} />
              <Btn label="Send again" onPress={() => run(async () => setMsg((await sendPin(email)).message))} />
            </View>
          </>
        ) : (
          <>
            <Muted>Sign in with your email. You get a PIN.</Muted>
            <Field placeholder="your email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={{ textAlign: 'left', width: '100%' }} />
            <Btn label="Send PIN" primary disabled={busy || !email.includes('@')} onPress={() => run(async () => {
              const r = await sendPin(email.trim());
              setMsg(r.message);
              if (r.ok) setPinSent(true);
            })} />
          </>
        )}
        {msg ? <Muted>{msg}</Muted> : null}
      </Card>
    </ScrollView>
  );
}
