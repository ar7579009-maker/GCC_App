import { useColorScheme } from 'react-native';

// Palette from the GATE Command Center look: warm dark by default, cream in light mode.
const dark = {
  bg: '#141210', pn: '#181512', cd: '#1e1b18', ln: '#322d28', tx: '#efe9df', mu: '#a39a8f',
  ac: '#e0892b', bad: '#ea6b53', ok: '#6fb99c', on: '#1a1209', tb: '#0f0d0b', in: '#141210',
};
const light = {
  bg: '#f4efe7', pn: '#ebe4d8', cd: '#fffaf2', ln: '#d9cfbf', tx: '#241f19', mu: '#6d6458',
  ac: '#b8620f', bad: '#b83a25', ok: '#2f7d62', on: '#ffffff', tb: '#e2d9ca', in: '#fffaf2',
};

export type Palette = typeof dark;

export function usePalette(): Palette {
  return useColorScheme() === 'light' ? light : dark;
}

// Names registered by useFonts() in App.tsx (see @expo-google-fonts/barlow-condensed).
export const font = {
  display: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 6, md: 8, lg: 12, pill: 999 };
