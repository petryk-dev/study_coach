import { AuthTokens } from '../api/types';
import { deleteItem, getItem, saveItem } from './secureStorage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

type SessionListener = (loggedIn: boolean) => void;
const listeners = new Set<SessionListener>();

/** Called with true when tokens are saved (login) and false when cleared (logout/expiry) */
export const subscribeToSession = (listener: SessionListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notify = (loggedIn: boolean) => listeners.forEach((listener) => listener(loggedIn));

// Kept in memory so every request doesn't have to read SecureStore
let cache: { accessToken: string | null; refreshToken: string | null } | null = null;

const load = async () => {
  if (!cache) {
    const [accessToken, refreshToken] = await Promise.all([
      getItem(ACCESS_TOKEN_KEY),
      getItem(REFRESH_TOKEN_KEY),
    ]);
    cache = { accessToken, refreshToken };
  }
  return cache;
};

export const getAccessToken = async () => (await load()).accessToken;

export const getRefreshToken = async () => (await load()).refreshToken;

export const saveTokens = async ({ accessToken, refreshToken }: AuthTokens) => {
  cache = { accessToken, refreshToken };
  await Promise.all([
    saveItem(ACCESS_TOKEN_KEY, accessToken),
    saveItem(REFRESH_TOKEN_KEY, refreshToken),
  ]);
  notify(true);
};

export const clearTokens = async () => {
  cache = { accessToken: null, refreshToken: null };
  await Promise.all([deleteItem(ACCESS_TOKEN_KEY), deleteItem(REFRESH_TOKEN_KEY)]);
  notify(false);
};
