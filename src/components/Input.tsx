import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function Input({ label, hint, containerStyle, style, ...inputProps }: Props) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={COLORS.textMuted}
        style={[styles.field, style]}
        {...inputProps}
      />
      {hint ? <Text style={styles.label}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  field: {
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontSize: TYPOGRAPHY.body.fontSize,
    color: COLORS.text,
    height: 48,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
  },
});
