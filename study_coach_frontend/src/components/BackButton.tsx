import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet } from 'react-native';

import { COLORS } from '../constants/colors';
import { RADIUS } from '../constants/spacing';

type Props = {
  icon?: 'back' | 'close';
};

export default function BackButton({ icon = 'back' }: Props) {
  const navigation = useNavigation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={icon === 'close' ? 'Close' : 'Go back'}
      hitSlop={8}
      onPress={() => navigation.goBack()}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Ionicons name={icon === 'close' ? 'close' : 'chevron-back'} size={20} color={COLORS.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
