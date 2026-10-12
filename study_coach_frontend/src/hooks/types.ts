import { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { ApiErrorBody } from '../api/types';

export type ApiError = AxiosError<ApiErrorBody>;

/** Extra options a screen can pass to a mutation hook (onSuccess, onError, ...) */
export type MutationProps<TData, TVariables = void> = Omit<
  UseMutationOptions<TData, ApiError, TVariables>,
  'mutationFn'
>;

/** Extra options a screen can pass to a query hook (enabled, staleTime, ...) */
export type QueryProps<TData> = Omit<UseQueryOptions<TData, ApiError>, 'queryKey' | 'queryFn'>;
