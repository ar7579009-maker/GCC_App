import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { StoreProvider, useStore } from './src/state/store';
import { Shell } from './src/components/Shell';
import { usePalette } from './src/theme';

function Root() {
  const p = usePalette();
  const store = useStore();
  if (!store.ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: p.bg }}>
        <ActivityIndicator color={p.ac} />
      </View>
    );
  }
  return <Shell />;
}

export default function App() {
  const [fontsLoaded] = useFonts({ BarlowCondensed_600SemiBold, BarlowCondensed_700Bold });
  const p = usePalette();
  return (
    <StoreProvider>
      <StatusBar style="auto" />
      {fontsLoaded ? <Root /> : <View style={{ flex: 1, backgroundColor: p.bg }} />}
    </StoreProvider>
  );
}
