import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { COLORS } from '../constants/colors';
import { RADIUS } from '../constants/spacing';

type Props = {
  /** Progress between 0 and 1 */
  value: number;
  style?: StyleProp<ViewStyle>;
};

export default function Progress({ value, style }: Props) {
  const clamped = Math.min(Math.max(value, 0), 1);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[styles.track, style]}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent,
  },
});
