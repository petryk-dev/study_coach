import { useMutation, useQuery } from '@tanstack/react-query';

import { getDueCards, gradeCard, GradeCardInput } from '../api/review';
import { DueCard, ReviewResult } from '../api/types';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { MutationProps, QueryProps } from './types';

type UseDueCardsProps = QueryProps<DueCard[]> & { deckId?: number };

/**
 * Cards for one review session: fetched fresh when the session starts, then kept
 * as-is, so grading or returning to the app doesn't reshuffle the cards mid-session.
 * gcTime 0 drops them when the session closes, so the next one never starts on old cards.
 */
export const useDueCards = ({ deckId, ...props }: UseDueCardsProps = {}) =>
  useQuery({
    refetchOnMount: 'always',
    staleTime: Infinity,
    gcTime: 0,
    ...props,
    queryKey: queryKeys.dueCards(deckId),
    queryFn: () => getDueCards(deckId),
  });

export const useGradeCard = ({
  onSuccess,
  ...props
}: MutationProps<ReviewResult, GradeCardInput> = {}) =>
  useMutation({
    ...props,
    mutationFn: gradeCard,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.decks });
      queryClient.invalidateQueries({ queryKey: queryKeys.todayPlan });
      return onSuccess?.(...args);
    },
  });
