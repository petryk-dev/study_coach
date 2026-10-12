import { api } from './client';

/** Saves this device's Expo push token for the daily plan notification */
export const savePushToken = async (token: string) => {
  await api.post('/me/push-token', { token });
};

export const deletePushToken = async () => {
  await api.delete('/me/push-token');
};
