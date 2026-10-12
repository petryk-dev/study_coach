import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';

export type QuizOptionState = 'default' | 'selected' | 'correct' | 'wrong';

type Props = {
  letter: string;
  text: string;
  state?: QuizOptionState;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ACTIVE_STATES: Record<
  Exclude<QuizOptionState, 'default'>,
  { color: string; background: string }
> = {
  selected: { color: COLORS.accent, background: COLORS.accentSoft },
  correct: { color: COLORS.success, background: COLORS.successSoft },
  wrong: { color: COLORS.danger, background: COLORS.dangerSoft },
};

export default function QuizOption({
  letter,
  text,
  state = 'default',
  onPress,
  disabled,
  style,
}: Props) {
  const active = state === 'default' ? null : ACTIVE_STATES[state];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: state !== 'default', disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        active && {
          backgroundColor: active.background,
          borderColor: active.color,
          borderWidth: 1.5,
        },
        style,
      ]}
    >
      <View style={[styles.key, active && { backgroundColor: active.color }]}>
        <Text style={[styles.keyText, active && styles.keyTextActive]}>{letter}</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
  key: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  keyTextActive: {
    color: COLORS.onAccent,
  },
  text: {
    ...TYPOGRAPHY.body,
    flex: 1,
    color: COLORS.text,
  },
});
