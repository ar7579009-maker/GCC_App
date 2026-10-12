# GATE Command Center (Android)

Native Android companion to the Windows app. React Native with Expo; no web view.

## Layout

- `src/core/`: the logic (syllabus progress, plan simulator, test status, timer helpers, sync row mapping). Pure TypeScript, no React Native imports. This is the same rule set as the Windows app, covered by `__tests__/`.
- `src/state/`: app state, saved on the device, and derived values.
- `src/data/`: Supabase client and cloud sign-in, push and pull. Same project and tables as the Windows app.
- `src/screens/`: Home, Syllabus, Tests, Plan, Settings.
- `src/components/`: shared UI pieces and the bottom tab shell.

## Develop

```sh
npm install
npm run typecheck
npm test
npx expo start --android
```

## Build an APK or AAB

Build in the cloud with EAS, so no Android Studio is needed:

```sh
npx eas-cli build -p android --profile preview    # APK for installing directly
npx eas-cli build -p android --profile production # AAB for Google Play
```

## Notes

- Background timing: the timer keeps time while the app is open. Keeping it running with the screen off needs a foreground service (Notifee or a native module). This is the next item.
- Sync: sign in with the email PIN, then "Sync now". Import `pw-sync-latest.json` from the PC in Settings.
- The Windows-only features (tray, start with Windows, sync folder watching) are not part of this app.
