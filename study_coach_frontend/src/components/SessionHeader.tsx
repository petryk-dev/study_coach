import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import BackButton from './BackButton';
import Progress from './Progress';

type Props = {
  /** 1-based position of the current item */
  current: number;
  total: number;
};

export default function SessionHeader({ current, total }: Props) {
  return (
    <View style={styles.container}>
      <BackButton icon="close" />
      <Progress value={total ? current / total : 0} style={styles.progress} />
      <Text style={styles.counter}>
        {current} / {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  progress: {
    flex: 1,
  },
  counter: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
});
