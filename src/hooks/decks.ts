import { useMutation, useQuery } from '@tanstack/react-query';

import {
  createDeck,
  CreateDeckInput,
  deleteDeck,
  DeckFilters,
  filterDecks,
  getDeck,
  getDecks,
} from '../api/decks';
import { Deck, DeckDetails, DeckListItem } from '../api/types';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';
import { MutationProps, QueryProps } from './types';

type UseDecksProps = QueryProps<DeckListItem[]> & { filters?: DeckFilters };

/** The user's decks; filters run on the cached list, so changing them doesn't refetch */
export const useDecks = ({ filters, ...props }: UseDecksProps = {}) =>
  useQuery({
    ...props,
    queryKey: queryKeys.decks,
    queryFn: getDecks,
    select: (decks) => filterDecks([...decks], filters),
  });

export const useDeck = (deckId: number, props: QueryProps<DeckDetails> = {}) =>
  useQuery({ ...props, queryKey: queryKeys.deck(deckId), queryFn: () => getDeck(deckId) });

export const useCreateDeck = ({ onSuccess, ...props }: MutationProps<Deck, CreateDeckInput> = {}) =>
  useMutation({
    ...props,
    mutationFn: createDeck,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.decks });
      queryClient.invalidateQueries({ queryKey: queryKeys.todayPlan });
      return onSuccess?.(...args);
    },
  });

export const useDeleteDeck = ({ onSuccess, ...props }: MutationProps<void, number> = {}) =>
  useMutation({
    ...props,
    mutationFn: deleteDeck,
    onSuccess: (...args) => {
      queryClient.removeQueries({ queryKey: queryKeys.deck(args[1]) });
      queryClient.invalidateQueries({ queryKey: queryKeys.decks });
      queryClient.invalidateQueries({ queryKey: queryKeys.todayPlan });
      return onSuccess?.(...args);
    },
  });
