import { useQuery } from '@tanstack/react-query';

import { getTodayPlan } from '../api/plan';
import { TodayPlan } from '../api/types';
import { queryKeys } from './queryKeys';
import { QueryProps } from './types';

export const useTodayPlan = (props: QueryProps<TodayPlan> = {}) =>
  useQuery({ ...props, queryKey: queryKeys.todayPlan, queryFn: getTodayPlan });
