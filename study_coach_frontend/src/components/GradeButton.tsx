import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

type Props = {
  grade: Grade;
  /** Time until the card comes back, e.g. "3d" */
  interval?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const GRADES: Record<Grade, { label: string; color: string; background: string }> = {
  again: { label: 'Again', color: COLORS.danger, background: COLORS.dangerSoft },
  hard: { label: 'Hard', color: COLORS.warning, background: COLORS.warningSoft },
  good: { label: 'Good', color: COLORS.success, background: COLORS.successSoft },
  easy: { label: 'Easy', color: COLORS.accent, background: COLORS.accentSoft },
};

export default function GradeButton({ grade, interval, onPress, style }: Props) {
  const { label, color, background } = GRADES[grade];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={interval ? `${label}, next review in ${interval}` : label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: background },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, { color }]}>{label}</Text>
      {interval ? <Text style={[styles.interval, { color }]}>{interval}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 78,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  pressed: { opacity: 0.7 },
  label: TYPOGRAPHY.bodyStrong,
  interval: TYPOGRAPHY.caption,
});
