import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Palette, usePalette } from '../theme';
import { font, radius, space } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const p = usePalette();
  return <View style={[{ backgroundColor: p.cd, borderColor: p.ln, borderWidth: 1, borderRadius: radius.lg, padding: space.lg }, style]}>{children}</View>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: object }) {
  const p = usePalette();
  return <Text style={[{ color: p.mu, fontSize: 14 }, style]}>{children}</Text>;
}

export function Display({ children, size = 40, color }: { children: React.ReactNode; size?: number; color?: string }) {
  const p = usePalette();
  return <Text style={{ fontFamily: font.display, fontSize: size, color: color ?? p.tx, letterSpacing: 0.3 }}>{children}</Text>;
}

export function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: space.md, paddingHorizontal: space.sm }}>
      <Display size={28}>{value}</Display>
      <Muted style={{ fontSize: 12, marginTop: 2, textTransform: 'uppercase' }}>{label}</Muted>
    </Card>
  );
}

export function Bar({ pct, ok }: { pct: number; ok?: boolean }) {
  const p = usePalette();
  return (
    <View style={{ height: 7, backgroundColor: p.ln, borderRadius: 4, overflow: 'hidden', marginTop: space.sm }}>
      <View style={{ height: 7, width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: ok ? p.ok : p.ac, borderRadius: 4 }} />
    </View>
  );
}

export function Pill({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={({ pressed }) => ({
        paddingHorizontal: 14, minHeight: 36, justifyContent: 'center', borderRadius: radius.pill,
        borderWidth: 1, borderColor: on ? p.ac : p.ln, backgroundColor: on ? p.ac : 'transparent',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: on ? p.on : p.mu, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

export function Btn({
  label, onPress, primary, disabled,
}: { label: string; onPress: () => void; primary?: boolean; disabled?: boolean }) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flex: 1, minHeight: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: space.lg, borderWidth: 1,
        borderColor: primary ? p.ac : p.ln, backgroundColor: primary ? p.ac : 'transparent',
        opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: primary ? p.on : p.tx, fontWeight: '600', fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function Check({ on, onPress }: { on: boolean; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      hitSlop={8}
      style={{
        width: 26, height: 26, borderRadius: 7, borderWidth: 1.5, borderColor: on ? p.ac : p.mu,
        backgroundColor: on ? p.ac : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: space.md,
      }}
    >
      {on ? <Text style={{ color: p.on, fontWeight: '900', fontSize: 15 }}>✓</Text> : null}
    </Pressable>
  );
}

export function Field(props: TextInputProps & { palette?: Palette }) {
  const p = usePalette();
  return (
    <TextInput
      placeholderTextColor={p.mu}
      {...props}
      style={[
        { color: p.tx, backgroundColor: p.in, borderColor: p.ln, borderWidth: 1, borderRadius: radius.md,
          paddingHorizontal: space.md, minHeight: 42, fontSize: 16, minWidth: 90, textAlign: 'right' },
        props.style,
      ]}
    />
  );
}

export function Heading({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return (
    <Text style={{ fontFamily: font.display, fontSize: 17, letterSpacing: 0.6, textTransform: 'uppercase', color: p.ac, marginTop: space.md }}>
      {children}
    </Text>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1, minWidth: 0 },
});
