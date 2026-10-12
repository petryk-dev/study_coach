import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../api/client';
import { canQuiz, getSummaryPoints } from '../api/decks';
import { BackButton, Button, ScreenContainer, StatCard, StatusView } from '../components';
import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import { useDeck } from '../hooks';
import { ScreenProps } from '../navigation/types';
import { formatShortDate } from '../utils/date';

export default function DeckScreen({ navigation, route }: ScreenProps<'Deck'>) {
  const { deckId } = route.params;
  const { data, error, isPending, isError, refetch } = useDeck(deckId);

  if (isPending || isError) {
    return (
      <ScreenContainer>
        <BackButton />
        {isPending ? (
          <StatusView loading />
        ) : (
          <StatusView
            message={getErrorMessage(error)}
            actionLabel="Try again"
            onAction={() => refetch()}
          />
        )}
      </ScreenContainer>
    );
  }

  const { deck, stats } = data;
  const summaryPoints = getSummaryPoints(deck.summary);

  return (
    <ScreenContainer
      onRefresh={refetch}
      footer={
        <View style={styles.actions}>
          <Button
            label="Quiz me"
            variant="secondary"
            onPress={() => navigation.navigate('Quiz', { deckId })}
            disabled={!canQuiz(stats)}
            style={styles.action}
          />
          <Button
            label={stats.due > 0 ? `Review ${stats.due} cards` : 'Nothing due'}
            onPress={() => navigation.navigate('Review', { deckId })}
            disabled={stats.due === 0}
            style={styles.action}
          />
        </View>
      }
    >
      <BackButton />

      <Text style={styles.title}>{deck.title}</Text>
      <Text style={styles.meta}>
        {stats.total} cards · created {formatShortDate(deck.created_at)}
      </Text>

      <View style={styles.stats}>
        <StatCard value={String(stats.due)} label="Due today" color={COLORS.warning} />
        <StatCard value={String(stats.mastered)} label="Mastered" color={COLORS.success} />
        <StatCard
          value={stats.lastQuizPercent !== null ? `${stats.lastQuizPercent}%` : '—'}
          label="Last quiz"
          color={COLORS.accent}
        />
      </View>

      {summaryPoints.length > 0 ? (
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Ionicons name="sparkles" size={12} color={COLORS.accent} />
            <Text style={styles.summaryLabel}>AI summary</Text>
          </View>
          {summaryPoints.map((point, index) => (
            <View key={index} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...TYPOGRAPHY.title,
    color: COLORS.text,
    marginTop: 24,
  },
  meta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  stats: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  summary: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: SPACING.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  summaryLabel: {
    ...TYPOGRAPHY.overline,
    color: COLORS.accent,
  },
  bullet: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  bulletDot: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  bulletText: {
    ...TYPOGRAPHY.body,
    flex: 1,
    color: COLORS.text,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  action: {
    flex: 1,
  },
});
