import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { FONTS } from '../constants/fonts';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
};

export default function CodeInput({ value, onChangeText, length = 6 }: Props) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  return (
    <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
      {Array.from({ length }, (_, index) => {
        const isActive = focused && index === Math.min(value.length, length - 1);
        return (
          <View key={index} style={[styles.cell, isActive && styles.cellActive]}>
            <Text style={styles.digit}>{value[index] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cell: {
    flex: 1,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  digit: {
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    color: COLORS.text,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
