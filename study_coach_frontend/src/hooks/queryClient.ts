import { focusManager, QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { AppState, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Don't retry client errors (401 is already handled by the refresh interceptor)
      retry: (failureCount, error) => {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

// Refetch stale queries when the app comes back to the foreground
AppState.addEventListener('change', (status) => {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
});
