import { useMutation } from '@tanstack/react-query';

import { savePushToken } from '../api/me';
import { MutationProps } from './types';

export const useSavePushToken = (props: MutationProps<void, string> = {}) =>
  useMutation({ ...props, mutationFn: savePushToken });
