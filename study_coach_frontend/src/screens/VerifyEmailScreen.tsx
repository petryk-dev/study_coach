import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../api/client';
import { BackButton, Button, CodeInput, ErrorText, ScreenContainer } from '../components';
import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import { useResendCode, useVerifyEmail } from '../hooks';
import { ScreenProps } from '../navigation/types';

const CODE_LENGTH = 6;
// Matches the backend's one-code-per-minute limit
const RESEND_SECONDS = 60;

const formatSeconds = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function VerifyEmailScreen({ navigation, route }: ScreenProps<'VerifyEmail'>) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const verify = useVerifyEmail({
    onSuccess: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
    onError: () => setCode(''),
  });
  const resend = useResendCode({
    onSuccess: () => setSecondsLeft(RESEND_SECONDS),
  });

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleChangeCode = (value: string) => {
    setCode(value);
    if (verify.isError) verify.reset();
  };

  const error = verify.error ?? resend.error;

  return (
    <ScreenContainer
      footer={
        <>
          <Button
            label="Verify email"
            onPress={() => verify.mutate({ email, code })}
            loading={verify.isPending}
            disabled={code.length < CODE_LENGTH}
          />
          <Text style={styles.mutedCenter}>
            Wrong email?{' '}
            <Text style={styles.link} onPress={() => navigation.goBack()}>
              Change it
            </Text>
          </Text>
        </>
      }
    >
      <BackButton />

      <View style={styles.icon}>
        <Ionicons name="mail-outline" size={24} color={COLORS.accent} />
      </View>

      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>
        We sent a {CODE_LENGTH}-digit code to{'\n'}
        <Text style={styles.email}>{email}</Text>
      </Text>

      <View style={styles.code}>
        <CodeInput value={code} onChangeText={handleChangeCode} length={CODE_LENGTH} />
        {error ? <ErrorText message={getErrorMessage(error)} /> : null}
      </View>

      <Text style={styles.mutedCenter}>
        Didn&apos;t get it?{' '}
        {secondsLeft > 0 ? (
          `Resend in ${formatSeconds(secondsLeft)}`
        ) : (
          <Text
            style={styles.link}
            onPress={resend.isPending ? undefined : () => resend.mutate(email)}
          >
            {resend.isPending ? 'Sending…' : 'Resend code'}
          </Text>
        )}
      </Text>

      <Text style={styles.help}>
        Can&apos;t find the email? Check your spam or promotions folder.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  title: {
    ...TYPOGRAPHY.title,
    color: COLORS.text,
    marginTop: 24,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  email: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
  },
  code: {
    marginTop: 32,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  mutedCenter: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  help: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 24,
  },
  link: {
    color: COLORS.accent,
  },
});
