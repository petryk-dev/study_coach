import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../api/client';
import { ReviewGrade } from '../api/types';
import {
  Button,
  ErrorText,
  GradeButton,
  ScreenContainer,
  SessionHeader,
  StatusView,
} from '../components';
import { Grade } from '../components/GradeButton';
import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import { useDueCards, useExplainCard, useGradeCard } from '../hooks';
import { ScreenProps } from '../navigation/types';

const GRADE_VALUES: Record<Grade, ReviewGrade> = {
  again: 0,
  hard: 1,
  good: 2,
  easy: 3,
};

const GRADES = Object.keys(GRADE_VALUES) as Grade[];

export default function ReviewScreen({ navigation, route }: ScreenProps<'Review'>) {
  const { deckId } = route.params;
  const dueCards = useDueCards({ deckId });
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const explain = useExplainCard();
  const gradeCard = useGradeCard({
    onError: (error) => Alert.alert('Couldn’t save your answer', getErrorMessage(error)),
  });

  const cards = dueCards.data ?? [];
  const card = cards[index];
  // Only show an explanation that belongs to the current card
  const explanation = explain.variables === card?.id ? explain : null;

  const handleGrade = (grade: Grade) => {
    if (!card) return;
    gradeCard.mutate({ cardId: card.id, grade: GRADE_VALUES[grade] });

    if (index + 1 >= cards.length) {
      navigation.goBack();
      return;
    }
    setIndex(index + 1);
    setRevealed(false);
    explain.reset();
  };

  if (dueCards.isPending || dueCards.isError || !card) {
    return (
      <ScreenContainer>
        <SessionHeader current={0} total={cards.length} />
        {dueCards.isPending ? (
          <StatusView loading />
        ) : dueCards.isError ? (
          <StatusView
            message={getErrorMessage(dueCards.error)}
            actionLabel="Try again"
            onAction={() => dueCards.refetch()}
          />
        ) : (
          <StatusView
            message="Nothing to review right now. Nice work!"
            actionLabel="Back"
            onAction={() => navigation.goBack()}
          />
        )}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      footer={
        revealed ? (
          <View style={styles.gradeSection}>
            <Text style={styles.muted}>How well did you know it?</Text>
            <View style={styles.grades}>
              {GRADES.map((grade) => (
                <GradeButton
                  key={grade}
                  grade={grade}
                  onPress={() => handleGrade(grade)}
                  style={styles.grade}
                />
              ))}
            </View>
          </View>
        ) : (
          <Button label="Show answer" variant="secondary" onPress={() => setRevealed(true)} />
        )
      }
    >
      <SessionHeader current={index + 1} total={cards.length} />

      {revealed ? (
        <View style={styles.card}>
          <Text style={styles.questionSmall}>{card.front}</Text>
          <View style={styles.divider} />
          <Text style={[styles.label, styles.answerLabel]}>Answer</Text>
          <Text style={styles.answer}>{card.back}</Text>

          {explanation?.data ? (
            <View style={styles.explanation}>
              <Text style={styles.explanationText}>{explanation.data.explanation}</Text>
              <Text style={styles.muted}>{explanation.data.example}</Text>
            </View>
          ) : (
            <View style={styles.explainArea}>
              {explanation?.isError ? (
                <ErrorText message={getErrorMessage(explanation.error)} />
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => explain.mutate(card.id)}
                disabled={explanation?.isPending}
                style={({ pressed }) => [styles.explain, pressed && styles.pressed]}
              >
                {explanation?.isPending ? (
                  <ActivityIndicator size="small" color={COLORS.accent} />
                ) : (
                  <Ionicons name="sparkles" size={12} color={COLORS.accent} />
                )}
                <Text style={styles.explainText}>Explain this simply</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Reveals the answer"
          onPress={() => setRevealed(true)}
          style={[styles.card, styles.cardCentered]}
        >
          <Text style={styles.label}>Question</Text>
          <Text style={styles.question}>{card.front}</Text>
          <Text style={[styles.muted, styles.tapHint]}>Tap the card to reveal the answer</Text>
        </Pressable>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cardCentered: {
    justifyContent: 'center',
  },
  label: {
    ...TYPOGRAPHY.overline,
    color: COLORS.textMuted,
  },
  question: {
    ...TYPOGRAPHY.heading,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  questionSmall: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  muted: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  tapHint: {
    marginTop: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },
  answerLabel: {
    color: COLORS.accent,
  },
  answer: {
    ...TYPOGRAPHY.title,
    fontSize: 22,
    lineHeight: 28,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  explainArea: {
    marginTop: 'auto',
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  },
  explain: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentSoft,
  },
  explainText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
  },
  explanation: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentSoft,
    gap: SPACING.sm,
  },
  explanationText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  pressed: { opacity: 0.7 },
  gradeSection: {
    gap: SPACING.md,
  },
  grades: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  grade: {
    flex: 1,
    width: undefined,
  },
});
