import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show notifications that arrive while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Asks for permission and returns this device's Expo push token,
 * or null when push isn't possible (simulator, permission denied, no EAS project).
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  // Simulators and emulators can't receive remote push notifications
  if (!Device.isDevice) return null;

  // Android 13+ only shows the permission prompt once a channel exists
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Daily plan',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  const finalStatus =
    existingStatus === 'granted'
      ? existingStatus
      : (await Notifications.requestPermissionsAsync()).status;
  if (finalStatus !== 'granted') return null;

  // Set by `npx eas-cli@latest init` in app.json under extra.eas.projectId
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('Push notifications: no EAS projectId. Run `npx eas-cli@latest init`.');
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
};
