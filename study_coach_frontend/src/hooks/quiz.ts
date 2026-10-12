import { useMutation } from '@tanstack/react-query';

import { createQuiz, submitQuiz, SubmitQuizInput } from '../api/quiz';
import { Quiz, QuizResult } from '../api/types';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { MutationProps } from './types';

/** Generates a new quiz for a deck (a POST, so it's a mutation) */
export const useCreateQuiz = (props: MutationProps<Quiz, number> = {}) =>
  useMutation({ ...props, mutationFn: createQuiz });

export const useSubmitQuiz = ({
  onSuccess,
  ...props
}: MutationProps<QuizResult, SubmitQuizInput> = {}) =>
  useMutation({
    ...props,
    mutationFn: submitQuiz,
    onSuccess: (...args) => {
      // Wrong answers move cards back into today's review
      queryClient.invalidateQueries({ queryKey: queryKeys.decks });
      queryClient.invalidateQueries({ queryKey: queryKeys.dueCardsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.todayPlan });
      return onSuccess?.(...args);
    },
  });
