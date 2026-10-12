import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../api/client';
import { formatDifficulty } from '../api/quiz';
import {
  Button,
  ErrorText,
  QuizOption,
  ScreenContainer,
  SessionHeader,
  StatusView,
} from '../components';
import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import { useCreateQuiz, useSubmitQuiz } from '../hooks';
import { ScreenProps } from '../navigation/types';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizScreen({ navigation, route }: ScreenProps<'Quiz'>) {
  const { deckId } = route.params;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const createQuiz = useCreateQuiz();
  const submitQuiz = useSubmitQuiz({
    onSuccess: (result) => navigation.replace('QuizResults', { deckId, result }),
  });

  // Each visit generates a new quiz; the ref stops a second request on re-render
  const started = useRef(false);
  const { mutate: generate } = createQuiz;
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    generate(deckId);
  }, [deckId, generate]);

  const quiz = createQuiz.data;

  if (!quiz) {
    return (
      <ScreenContainer>
        <SessionHeader current={0} total={0} />
        {createQuiz.isError ? (
          <StatusView
            message={getErrorMessage(createQuiz.error)}
            actionLabel="Try again"
            onAction={() => generate(deckId)}
          />
        ) : (
          <StatusView loading message="Writing your quiz…" />
        )}
      </ScreenContainer>
    );
  }

  const question = quiz.questions[index];
  const selected = answers[index] as number | undefined;
  const isLast = index + 1 >= quiz.questions.length;

  const select = (optionIndex: number) => {
    const next = [...answers];
    next[index] = optionIndex;
    setAnswers(next);
  };

  // Correct answers stay on the server until the quiz is submitted,
  // so the results screen shows what was right
  const handleNext = () => {
    if (isLast) submitQuiz.mutate({ quizId: quiz.quizId, answers });
    else setIndex(index + 1);
  };

  return (
    <ScreenContainer
      footer={
        <>
          {submitQuiz.isError ? <ErrorText message={getErrorMessage(submitQuiz.error)} /> : null}
          <Button
            label={isLast ? 'See results' : 'Next question'}
            onPress={handleNext}
            loading={submitQuiz.isPending}
            disabled={selected === undefined}
          />
        </>
      }
    >
      <SessionHeader current={index + 1} total={quiz.questions.length} />

      <View style={styles.difficulty}>
        <Text style={styles.difficultyText}>{formatDifficulty(quiz.difficulty)}</Text>
      </View>
      <Text style={styles.question}>{question.question}</Text>

      <View style={styles.options}>
        {question.options.map((option, optionIndex) => (
          <QuizOption
            key={optionIndex}
            letter={LETTERS[optionIndex]}
            text={option}
            state={optionIndex === selected ? 'selected' : 'default'}
            onPress={() => select(optionIndex)}
            disabled={submitQuiz.isPending}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  difficulty: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
  },
  difficultyText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textMuted,
  },
  question: {
    ...TYPOGRAPHY.heading,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  options: {
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
});
