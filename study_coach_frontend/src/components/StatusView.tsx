import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import Button from './Button';

type Props = {
  loading?: boolean;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Centered loading spinner, or a message with an optional action (e.g. "Try again") */
export default function StatusView({ loading, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={COLORS.accent} /> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: 40,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
  },
});
