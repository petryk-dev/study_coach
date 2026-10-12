// Response shapes from the Study Coach backend (see its /docs for the full spec)

export type User = {
  id: number;
  email: string;
  name: string | null;
  email_verified: boolean | null;
  push_token: string | null;
  created_at: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResult = AuthTokens & { user: User };

export type MessageResponse = { message: string };

export type Card = {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  ease: number | null;
  interval: number | null;
  repetitions: number | null;
  lapses: number | null;
  /** Date only; the time part is always 00:00:00Z */
  due_date: string | null;
  explanation: string | null;
  explanation_example: string | null;
  created_at: string | null;
};

export type Deck = {
  id: number;
  user_id: number;
  title: string;
  source_text: string | null;
  summary: string | null;
  created_at: string | null;
  cards: Card[];
};

export type DeckListItem = {
  id: number;
  title: string;
  summary: string | null;
  created_at: string | null;
  card_count: number;
  dueCount: number;
};

export type DeckStats = {
  total: number;
  due: number;
  /** Cards with an interval of 21+ days */
  mastered: number;
  /** null if the deck has no quizzes yet */
  lastQuizPercent: number | null;
};

export type DeckDetails = {
  deck: Deck;
  stats: DeckStats;
};

export type DueCard = Pick<Card, 'id' | 'front' | 'back' | 'deck_id'>;

/** 0 Again, 1 Hard, 2 Good, 3 Easy */
export type ReviewGrade = 0 | 1 | 2 | 3;

export type ReviewResult = {
  /** yyyy-mm-dd */
  nextDue: string;
  /** Days until the next review */
  interval: number;
};

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export type Quiz = {
  quizId: number;
  difficulty: QuizDifficulty;
  /** Correct answers stay on the server until the quiz is submitted */
  questions: { question: string; options: string[] }[];
};

export type QuizResult = {
  score: number;
  total: number;
  /** null on the first attempt for this deck */
  previousPercent: number | null;
  /** Cards behind wrong answers, moved back into today's review */
  cardsToReview: number;
  results: {
    question: string;
    options: string[];
    chosen: number;
    correct: number;
    isCorrect: boolean;
    explanation: string;
  }[];
};

export type CardExplanation = {
  explanation: string;
  example: string;
  cached: boolean;
};

export type PlanTask = {
  type: 'review' | 'quiz';
  deckId: number;
  deckTitle: string;
  /** Cards to review, or 1 for a quiz */
  target: number;
  done: number;
  completed: boolean;
};

export type TodayPlan = {
  /** yyyy-mm-dd */
  date: string;
  headline: string;
  tip: string | null;
  tasks: PlanTask[];
  /** 0–1, for the progress bar */
  progress: number;
  streak: number;
};

export type ApiErrorBody = {
  error: string;
  code?: string;
  details?: { field: string; message: string }[];
};
