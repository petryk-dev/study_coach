import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { hasSession } from './src/api/auth';
import { setSessionExpiredHandler } from './src/api/client';
import { COLORS } from './src/constants/colors';
import { usePushTokenRegistration } from './src/hooks/notifications';
import { queryClient } from './src/hooks/queryClient';
import { navigationRef, resetTo } from './src/navigation/navigationRef';
import RootNavigator from './src/navigation/RootNavigator';

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: COLORS.background, primary: COLORS.accent },
};

// The refresh token was rejected: drop cached data and send the user to Login
setSessionExpiredHandler(() => {
  queryClient.clear();
  resetTo('Login');
});

// Separate component so the hook runs inside QueryClientProvider
function PushTokenRegistration() {
  usePushTokenRegistration();
  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Home' | null>(null);

  useEffect(() => {
    hasSession()
      .then((loggedIn) => setInitialRoute(loggedIn ? 'Home' : 'Login'))
      .catch(() => setInitialRoute('Login'));
  }, []);

  if (!fontsLoaded || !initialRoute) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PushTokenRegistration />
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} theme={theme}>
          <RootNavigator initialRouteName={initialRoute} />
        </NavigationContainer>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
