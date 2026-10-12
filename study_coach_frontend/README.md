# Study Coach — Mobile App

Study Coach turns your notes into flashcards and gives you a study plan for each day. Paste text or upload a PDF, and the app generates a deck of flashcards with an AI summary. Then study with spaced-repetition review and quizzes that adapt to how well you're doing.

This repository is the **React Native (Expo) client**. The API lives in a separate repository, [`study_coach_backend`](../study_coach_backend).

## Features

- **Accounts**: sign up with email verification by a 6-digit code, log in, and stay signed in with access and refresh tokens
- **Deck generation**: create a deck from pasted notes (50–30,000 characters) or a PDF that contains text
- **Deck overview**: cards due today, mastered cards, last quiz score and an AI summary
- **Spaced-repetition review**: grade each card *Again / Hard / Good / Easy*, with "Explain this simply" on any answer
- **Adaptive quizzes**: multiple-choice questions whose difficulty follows your recent scores, with a review of every answer at the end
- **Daily plan**: Home shows today's review and quiz tasks with progress, plus "Continue session"
- **Push notifications**: a daily plan reminder sent by the backend

## Tech stack

| Area | Choice |
|---|---|
| Framework | [Expo](https://docs.expo.dev) SDK 57, React Native 0.86, React 19 |
| Language | TypeScript (strict) |
| Navigation | React Navigation 7, native stack (no Expo Router) |
| Server state | TanStack React Query 5 |
| HTTP | axios, with interceptors for auth and token refresh |
| Secure storage | `expo-secure-store` for auth tokens |
| Other Expo modules | `expo-notifications`, `expo-document-picker`, `expo-font` (Inter) |
| Native projects | [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/) — `ios/` and `android/` are generated, not committed |

## Getting started

### Prerequisites

- Node.js 20 or newer, and npm
- The [backend](../study_coach_backend) running locally (port `3006` by default)
- For native builds: Xcode (iOS) and/or Android Studio, or an [EAS](https://docs.expo.dev/eas/) account to build in the cloud

### Install

```bash
npm install
cp .env.example .env.local   # then set EXPO_PUBLIC_API_URL
```

### Configure the API URL

| Running on | `EXPO_PUBLIC_API_URL` |
|---|---|
| iOS simulator | `http://localhost:3006` |
| Android emulator | `http://10.0.2.2:3006` |
| Physical device | Your computer's LAN address, e.g. `http://192.168.1.5:3006` |

If the variable isn't set, the app uses the simulator/emulator defaults above.

### Run

The app uses native modules (secure storage, notifications), so run it as a [development build](https://docs.expo.dev/develop/development-builds/introduction/) rather than in Expo Go:

```bash
npx expo run:ios        # build and launch on the iOS simulator / a device
npx expo run:android    # build and launch on an Android emulator / a device
npx expo start          # start Metro for an existing development build
```

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the Metro dev server |
| `npm run ios` / `npm run android` | Start Metro and open the app on a simulator or emulator |
| `npm run lint` | Run ESLint (`eslint-config-expo`) |
| `npx tsc --noEmit` | Type-check the project |
| `npx expo-doctor` | Check dependencies and config for problems |
| `npx expo install <pkg>` | Add a dependency at a version that matches the SDK (use this instead of `npm install <pkg>`) |

Run lint and the type check before opening a pull request.

## Project structure

```
App.tsx                  App root: fonts, providers, session check, push registration
index.ts                 Entry point (registerRootComponent)
src/
  api/                   Requests and data logic (no React)
    client.ts            axios instance, auth interceptors, error helpers
    <resource>.ts        Request functions plus pure helpers (filters, sorting, formatting)
    types.ts             API response types
  hooks/                 React Query hooks that wrap src/api
    queryClient.ts       QueryClient configuration
    queryKeys.ts         Query key factory
    types.ts             MutationProps / QueryProps option types
  components/            Reusable UI (Button, Input, DeckCard, QuizOption, ...)
  screens/               One file per screen
  navigation/            Stack navigator, route params, navigation ref
  constants/             Design tokens: colors, spacing, typography, fonts
  utils/                 Token storage, push notifications, date helpers
  images/                Static images
assets/                  App icon, splash screen and favicon
```

### Data layer

The data layer has two parts, and each has one job:

- **`src/api/`** contains plain async functions and pure logic. It is the only place that talks to the network, always through the shared axios instance in `client.ts`.
- **`src/hooks/`** wraps those functions in React Query. Screens pass options such as `onSuccess`, `onError` and `filters`, and the hooks keep the cache up to date.

```tsx
const login = useLogin({
  onSuccess: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
});

const decks = useDecks({ filters: { sortBy: 'mostDue' } });
```

### Authentication

- **Bearer token**: the access token is added to every request except the public `/auth/*` routes (login, register, verify-email and so on).
- **401 responses**: the client refreshes the token once, then retries the original request. Requests that fail at the same time **share a single refresh call**, because refresh tokens are single-use and reusing one logs out every session.
- **Failed refresh**: if the refresh fails, the tokens are cleared, the cache is emptied and the user is sent to Login.
- **Storage**: tokens are kept in `expo-secure-store`, with an in-memory copy so requests don't read storage each time.

## Push notifications

The app sends its Expo push token to the backend after login, when it starts with a saved session, and whenever the token changes. Logging out removes the token from the backend. Before this works:

1. Link an EAS project, which writes `extra.eas.projectId` to `app.json`:
   ```bash
   npx eas-cli@latest init
   ```
2. Use a **physical device** with a development build. Simulators and Expo Go can't receive remote push notifications.
3. **Android**: add Firebase credentials (`google-services.json`, and upload the FCM key to EAS).
4. **iOS**: an EAS build sets up the push certificate (requires a paid Apple Developer account).

## Building and releasing

Builds, store submission and over-the-air updates go through [EAS](https://docs.expo.dev/eas/):

```bash
npx eas-cli@latest build:configure                # first time only: creates eas.json with build profiles
npx eas-cli@latest build --profile development   # development build
npx eas-cli@latest build --profile production    # store build
npx eas-cli@latest submit                         # upload to the App Store / Google Play
npx eas-cli@latest update                         # ship a JavaScript-only update
```

Native configuration belongs in `app.json` and config plugins. Never edit `ios/` or `android/` by hand, because they are regenerated on every prebuild.

## Contributing

- Follow the conventions in [AGENTS.md](AGENTS.md): folder structure, the API layering and Expo-specific rules.
- Use the design tokens in `src/constants/` instead of hard-coded colors and sizes.
- Add dependencies with `npx expo install` so their versions match the SDK.
