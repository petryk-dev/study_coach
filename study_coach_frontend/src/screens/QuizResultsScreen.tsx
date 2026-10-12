import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { getScoreSummary } from '../api/quiz';
import { BackButton, Button, ScreenContainer } from '../components';
import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import { ScreenProps } from '../navigation/types';

export default function QuizResultsScreen({ navigation, route }: ScreenProps<'QuizResults'>) {
  const { deckId, result } = route.params;

  return (
    <ScreenContainer
      footer={
        result.cardsToReview > 0 ? (
          <Button
            label="Review weak cards"
            onPress={() => navigation.replace('Review', { deckId })}
          />
        ) : (
          <Button label="Back to deck" variant="secondary" onPress={() => navigation.goBack()} />
        )
      }
    >
      <BackButton icon="close" />

      <Text style={styles.overline}>Quiz complete</Text>
      <View style={styles.scoreRow}>
        <Text style={styles.score}>{result.score}</Text>
        <Text style={styles.total}>/ {result.total}</Text>
      </View>
      <Text style={styles.summary}>{getScoreSummary(result)}</Text>

      <Text style={styles.sectionTitle}>Review your answers</Text>
      <View style={styles.answers}>
        {result.results.map((item, i) => {
          const { isCorrect } = item;
          const correctOption = item.options[item.correct];
          const chosenOption = item.options[item.chosen];

          return (
            <View key={i} style={styles.answerRow}>
              <View
                style={[
                  styles.answerIcon,
                  { backgroundColor: isCorrect ? COLORS.successSoft : COLORS.dangerSoft },
                ]}
              >
                <Ionicons
                  name={isCorrect ? 'checkmark' : 'close'}
                  size={12}
                  color={isCorrect ? COLORS.success : COLORS.danger}
                />
              </View>
              <View style={styles.answerText}>
                <Text style={styles.answerQuestion} numberOfLines={1}>
                  {item.question}
                </Text>
                <Text style={styles.answerDetail}>
                  {isCorrect ? correctOption : `${correctOption} · you chose ${chosenOption}`}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  overline: {
    ...TYPOGRAPHY.overline,
    color: COLORS.textMuted,
    marginTop: 24,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  score: {
    fontFamily: TYPOGRAPHY.title.fontFamily,
    fontSize: 48,
    lineHeight: 56,
    color: COLORS.text,
  },
  total: {
    ...TYPOGRAPHY.heading,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    color: COLORS.textMuted,
  },
  summary: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
    marginTop: 24,
    marginBottom: SPACING.md,
  },
  answers: {
    gap: SPACING.sm,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  answerIcon: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  answerText: {
    flex: 1,
    gap: 2,
  },
  answerQuestion: {
    ...TYPOGRAPHY.caption,
    fontFamily: TYPOGRAPHY.bodyStrong.fontFamily,
    color: COLORS.text,
  },
  answerDetail: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.textMuted,
  },
});
