import { useMutation, useQuery } from '@tanstack/react-query';

import {
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resendCode,
  resetPassword,
  verifyEmail,
} from '../api/auth';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { MutationProps, QueryProps } from './types';

type Props<T extends (...args: never[]) => Promise<unknown>> = MutationProps<
  Awaited<ReturnType<T>>,
  Parameters<T>[0]
>;

export const useRegister = (props: Props<typeof register> = {}) =>
  useMutation({ ...props, mutationFn: register });

export const useVerifyEmail = ({ onSuccess, ...props }: Props<typeof verifyEmail> = {}) =>
  useMutation({
    ...props,
    mutationFn: verifyEmail,
    onSuccess: (...args) => {
      queryClient.setQueryData(queryKeys.me, args[0].user);
      return onSuccess?.(...args);
    },
  });

export const useResendCode = (props: Props<typeof resendCode> = {}) =>
  useMutation({ ...props, mutationFn: resendCode });

export const useLogin = ({ onSuccess, ...props }: Props<typeof login> = {}) =>
  useMutation({
    ...props,
    mutationFn: login,
    onSuccess: (...args) => {
      queryClient.setQueryData(queryKeys.me, args[0].user);
      return onSuccess?.(...args);
    },
  });

export const useForgotPassword = (props: Props<typeof forgotPassword> = {}) =>
  useMutation({ ...props, mutationFn: forgotPassword });

export const useResetPassword = (props: Props<typeof resetPassword> = {}) =>
  useMutation({ ...props, mutationFn: resetPassword });

export const useLogout = ({ onSettled, ...props }: MutationProps<void> = {}) =>
  useMutation({
    ...props,
    mutationFn: logout,
    onSettled: (...args) => {
      // Drop every cached response from this account
      queryClient.clear();
      return onSettled?.(...args);
    },
  });

export const useMe = (props: QueryProps<Awaited<ReturnType<typeof getMe>>> = {}) =>
  useQuery({ ...props, queryKey: queryKeys.me, queryFn: getMe });
