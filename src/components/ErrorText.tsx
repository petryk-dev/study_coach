import { StyleSheet, Text } from 'react-native';

import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

type Props = {
  message?: string | null;
};

export default function ErrorText({ message }: Props) {
  if (!message) return null;

  return (
    <Text accessibilityRole="alert" style={styles.text}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
  },
});
