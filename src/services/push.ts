import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import prisma from './db';
import { logError } from '../utils/logger';

// EXPO_ACCESS_TOKEN is optional; needed only if push security is enabled in the Expo project
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN || undefined });

export type PushMessage = ExpoPushMessage & { userId: number };

// The parts of the Expo client used here; tests can pass a fake
type PushClient = Pick<Expo, 'chunkPushNotifications' | 'sendPushNotificationsAsync'>;

/**
 * Sends notifications in chunks of up to 100. Tokens Expo reports as DeviceNotRegistered
 * (app uninstalled or notifications turned off) are cleared, so we stop sending to them.
 */
export async function sendPushes(messages: PushMessage[], client: PushClient = expo): Promise<void> {
  for (const chunk of client.chunkPushNotifications(messages) as PushMessage[][]) {
    try {
      // userId is ours, not Expo's, so it's left out of what we send
      const tickets = await client.sendPushNotificationsAsync(chunk.map(({ userId: _, ...m }) => m));

      // Tickets come back in the same order as the messages
      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          const { userId, to } = chunk[i];
          // Only clear it if the user still has this token (they may have registered a new one)
          await prisma.users.updateMany({ where: { id: userId, push_token: String(to) }, data: { push_token: null } });
        } else if (ticket.status === 'error') {
          logError(`[push] ticket error for user ${chunk[i].userId}: ${ticket.message}`);
        }
      }
    } catch (err) {
      logError('[push] send failed', err); // one bad chunk shouldn't stop the others
    }
  }
}
