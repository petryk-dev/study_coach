import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';

type Props = {
  title: string;
  meta: string;
  initial?: string;
  due?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function DeckCard({ title, meta, initial, due, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}
    >
      <View style={styles.initial}>
        <Text style={styles.initialText}>{initial ?? title.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {due ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{due}</Text>
        </View>
      ) : null}
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
    borderRadius: RADIUS.lg,
  },
  pressed: { opacity: 0.7 },
  initial: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.accent,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
  },
  meta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.warningSoft,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
  },
});
