import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { getDisplayName } from '../api/auth';
import { getErrorMessage } from '../api/client';
import { getNextTask, getTaskLabel, getTaskProgress } from '../api/plan';
import { PlanTask } from '../api/types';
import { Button, DeckCard, Progress, ScreenContainer, StatusView } from '../components';
import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import { useDecks, useLogout, useMe, useTodayPlan } from '../hooks';
import { ScreenProps } from '../navigation/types';
import { formatLongDate, formatShortDate, getGreeting } from '../utils/date';

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const me = useMe();
  const plan = useTodayPlan();
  const decks = useDecks({ filters: { sortBy: 'mostDue' } });
  const logout = useLogout({
    onSettled: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
  });

  const now = new Date();
  const nextTask = plan.data ? getNextTask(plan.data) : undefined;
  const handleRefresh = () => Promise.all([plan.refetch(), decks.refetch()]);

  const startTask = (task: PlanTask) => {
    if (task.type === 'review') navigation.navigate('Review', { deckId: task.deckId });
    else navigation.navigate('Quiz', { deckId: task.deckId });
  };

  const confirmLogout = () =>
    Alert.alert('Log out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout.mutate() },
    ]);

  const name = me.data ? getDisplayName(me.data) : '';

  return (
    <ScreenContainer onRefresh={handleRefresh}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.date}>{formatLongDate(now)}</Text>
          <Text style={styles.greeting}>
            {getGreeting(now.getHours())}
            {name ? `, ${name}` : ''}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account"
          onPress={confirmLogout}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
        </Pressable>
      </View>

      <View style={styles.planCard}>
        {plan.isPending ? (
          <StatusView loading />
        ) : plan.isError ? (
          <StatusView
            message={getErrorMessage(plan.error)}
            actionLabel="Try again"
            onAction={() => plan.refetch()}
          />
        ) : (
          <>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Today&apos;s plan</Text>
            </View>
            <Text style={styles.planTitle}>{plan.data.headline}</Text>
            {plan.data.tip ? <Text style={styles.planSubtitle}>{plan.data.tip}</Text> : null}

            {plan.data.tasks.length > 0 ? (
              <>
                <Progress value={plan.data.progress} style={styles.progress} />
                <View style={styles.tasks}>
                  {plan.data.tasks.map((task) => (
                    <View key={`${task.type}-${task.deckId}`} style={styles.task}>
                      <View style={[styles.check, task.completed && styles.checkDone]}>
                        {task.completed ? (
                          <Ionicons name="checkmark" size={12} color={COLORS.onAccent} />
                        ) : null}
                      </View>
                      <Text style={[styles.taskLabel, task.completed && styles.taskLabelDone]}>
                        {getTaskLabel(task)}
                      </Text>
                      <Text style={styles.taskMeta}>{getTaskProgress(task)}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {nextTask ? (
              <Button
                label="Continue session"
                onPress={() => startTask(nextTask)}
                style={styles.planButton}
              />
            ) : null}
          </>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your decks</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('NewDeck')}
          style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={14} color={COLORS.accent} />
          <Text style={styles.newButtonText}>New</Text>
        </Pressable>
      </View>

      {decks.isPending ? (
        <StatusView loading />
      ) : decks.isError ? (
        <StatusView
          message={getErrorMessage(decks.error)}
          actionLabel="Try again"
          onAction={() => decks.refetch()}
        />
      ) : decks.data.length === 0 ? (
        <StatusView
          message="No decks yet. Paste your notes or upload a PDF to make your first one."
          actionLabel="Create a deck"
          onAction={() => navigation.navigate('NewDeck')}
        />
      ) : (
        <View style={styles.decks}>
          {decks.data.map((deck) => (
            <DeckCard
              key={deck.id}
              title={deck.title}
              meta={`${deck.card_count} cards · created ${formatShortDate(deck.created_at)}`}
              due={deck.dueCount > 0 ? `${deck.dueCount} due` : undefined}
              onPress={() => navigation.navigate('Deck', { deckId: deck.id })}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: 24,
  },
  headerText: { flex: 1 },
  date: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  greeting: {
    ...TYPOGRAPHY.heading,
    color: COLORS.text,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.accent,
  },
  planCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentSoft,
    marginBottom: SPACING.sm,
  },
  planBadgeText: {
    ...TYPOGRAPHY.overline,
    color: COLORS.accent,
  },
  planTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
  },
  planSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progress: {
    marginTop: SPACING.md,
  },
  tasks: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  taskLabel: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    color: COLORS.text,
  },
  taskLabelDone: {
    color: COLORS.textMuted,
  },
  taskMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  planButton: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentSoft,
  },
  newButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
  },
  pressed: { opacity: 0.7 },
  decks: {
    gap: SPACING.md,
  },
});
