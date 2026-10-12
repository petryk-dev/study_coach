import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';

type Props = {
  value: string;
  label: string;
  color: string;
};

export default function StatCard({ value, label, color }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 2,
  },
  value: TYPOGRAPHY.heading,
  label: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.textMuted,
  },
});
