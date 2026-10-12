import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'soft';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Shows a spinner and blocks presses */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const VARIANTS: Record<ButtonVariant, { container: ViewStyle; color: string }> = {
  primary: { container: { backgroundColor: COLORS.accent }, color: COLORS.onAccent },
  secondary: {
    container: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    color: COLORS.text,
  },
  soft: { container: { backgroundColor: COLORS.accentSoft }, color: COLORS.accent },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: Props) {
  const { container, color } = VARIANTS[variant];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.container,
        container,
        (pressed || disabled) && !loading && styles.dimmed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: TYPOGRAPHY.bodyStrong,
  dimmed: { opacity: 0.6 },
});
