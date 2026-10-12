import {
  AxiosError,
  create,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";
import { Platform } from "react-native";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "../utils/tokenStorage";
import { ApiErrorBody, AuthTokens } from "./types";

// Android emulators reach the host machine at 10.0.2.2. On a physical device,
// set EXPO_PUBLIC_API_URL to your computer's LAN address, e.g. http://192.168.1.5:3006
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:3006"
    : "http://localhost:3006");

// Auth endpoints that work without a logged-in user. They never get a Bearer token,
// and a 401 from them (e.g. wrong password) must not trigger a token refresh.
// /auth/me is not listed: it needs the token like every other endpoint.
const PUBLIC_AUTH_PATHS = [
  "/auth/register",
  "/auth/verify-email",
  "/auth/resend-code",
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
];

const isPublicAuthRequest = (config: InternalAxiosRequestConfig) =>
  PUBLIC_AUTH_PATHS.some((path) => config.url?.startsWith(path));

// No default Content-Type: axios sets JSON for objects, and leaving it unset
// lets React Native add the multipart boundary for FormData (PDF upload).
export const api = create({
  baseURL: API_URL,
  timeout: 15_000,
});

// Separate instance without interceptors, so a failing refresh can't loop
const refreshClient = create({ baseURL: API_URL, timeout: 15_000 });

// ---------- Session expiry ----------

let onSessionExpired: (() => void) | null = null;

/** Called when the refresh token is rejected; use it to send the user to Login */
export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

// ---------- Request: attach the Bearer token ----------

api.interceptors.request.use(async (config) => {
  if (!isPublicAuthRequest(config)) {
    const accessToken = await getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

// ---------- Response: refresh the token on 401 and retry once ----------

// Refresh tokens are single use, and the backend logs out every session when one
// is reused. So all requests that fail at the same time share one refresh call.
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = () => {
  refreshPromise ??= (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await refreshClient.post<AuthTokens>("/auth/refresh", {
        refreshToken,
      });
      await saveTokens(data);
      return data.accessToken;
    } catch (error) {
      await clearTokens();
      onSessionExpired?.();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      isPublicAuthRequest(config)
    ) {
      throw error;
    }

    config._retry = true;
    const accessToken = await refreshAccessToken();
    config.headers.Authorization = `Bearer ${accessToken}`;
    return api(config);
  },
);

// ---------- Errors ----------

/** The backend's error message, or a fallback for network/unknown errors */
export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Try again.",
) => {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (error.response?.data?.error) return error.response.data.error;
    if (!error.response)
      return "Can’t reach the server. Check your connection.";
  }
  return fallback;
};

/** The backend's error code, e.g. EMAIL_NOT_VERIFIED */
export const getErrorCode = (error: unknown) =>
  isAxiosError<ApiErrorBody>(error) ? error.response?.data?.code : undefined;
