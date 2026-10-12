import { useMutation } from '@tanstack/react-query';

import { explainCard, updateCard, UpdateCardInput } from '../api/cards';
import { Card, CardExplanation } from '../api/types';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { MutationProps } from './types';

export const useExplainCard = (props: MutationProps<CardExplanation, number> = {}) =>
  useMutation({ ...props, mutationFn: explainCard });

export const useUpdateCard = ({
  onSuccess,
  ...props
}: MutationProps<Pick<Card, 'id' | 'deck_id' | 'front' | 'back'>, UpdateCardInput> = {}) =>
  useMutation({
    ...props,
    mutationFn: updateCard,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deck(args[0].deck_id) });
      return onSuccess?.(...args);
    },
  });
