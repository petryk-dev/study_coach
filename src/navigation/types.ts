import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { QuizResult } from '../api/types';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  Home: undefined;
  NewDeck: undefined;
  Deck: { deckId: number };
  /** Without deckId, reviews due cards from every deck */
  Review: { deckId?: number };
  Quiz: { deckId: number };
  QuizResults: { deckId: number; result: QuizResult };
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
