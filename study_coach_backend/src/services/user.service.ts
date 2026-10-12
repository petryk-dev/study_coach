import { Expo } from 'expo-server-sdk';
import prisma from './db';
import { HttpError } from '../utils/httpError';

/**
 * Saves the device's Expo push token. One device, one user: the token is removed from
 * any other account first, so a shared phone never gets someone else's plan.
 */
export async function savePushToken(userId: number, token: unknown): Promise<void> {
  if (typeof token !== 'string' || !Expo.isExpoPushToken(token)) {
    throw new HttpError(400, 'Invalid push token', 'INVALID_PUSH_TOKEN');
  }

  await prisma.$transaction([
    prisma.users.updateMany({ where: { push_token: token, NOT: { id: userId } }, data: { push_token: null } }),
    prisma.users.update({ where: { id: userId }, data: { push_token: token } }),
  ]);
}

/** Called by the app on logout. */
export async function clearPushToken(userId: number): Promise<void> {
  await prisma.users.update({ where: { id: userId }, data: { push_token: null } });
}
