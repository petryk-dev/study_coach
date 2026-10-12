import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';

import { hasSession } from '../api/auth';
import { getExpoPushToken } from '../utils/pushNotifications';
import { subscribeToSession } from '../utils/tokenStorage';
import { useSavePushToken } from './me';

/**
 * Keeps the backend's push token up to date for the logged-in user. Mount it once at the
 * app root: it registers on app start (if logged in), right after each login, and whenever
 * the OS rotates the token. Logout removes the token on the server (see api/auth logout).
 */
export const usePushTokenRegistration = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const { mutate: savePushToken } = useSavePushToken({
    onError: (error) => console.warn('Push notifications: could not save token', error.message),
  });

  useEffect(() => {
    hasSession().then(setLoggedIn).catch(() => setLoggedIn(false));
    return subscribeToSession(setLoggedIn);
  }, []);

  useEffect(() => {
    if (!loggedIn) return;

    let cancelled = false;
    getExpoPushToken()
      .then((token) => {
        if (token && !cancelled) savePushToken(token);
      })
      .catch((error) => console.warn('Push notifications: could not get token', error));

    // The native token can change (app reinstall, OS refresh); fetch the new Expo token then
    const subscription = Notifications.addPushTokenListener(() => {
      getExpoPushToken()
        .then((token) => {
          if (token) savePushToken(token);
        })
        .catch(() => undefined);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [loggedIn, savePushToken]);
};
