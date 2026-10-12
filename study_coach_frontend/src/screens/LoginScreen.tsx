import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getErrorCode, getErrorMessage } from '../api/client';
import { Button, ErrorText, Input, ScreenContainer } from '../components';
import { COLORS } from '../constants/colors';
import { RADIUS, SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import { useLogin, useResendCode } from '../hooks';
import { ScreenProps } from '../navigation/types';

export default function LoginScreen({ navigation }: ScreenProps<'Login'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const resendCode = useResendCode();
  const login = useLogin({
    onSuccess: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
    onError: (error, variables) => {
      // Registered but never entered the code: send a fresh one and finish verification
      if (getErrorCode(error) === 'EMAIL_NOT_VERIFIED') {
        resendCode.mutate(variables.email);
        navigation.navigate('VerifyEmail', { email: variables.email });
      }
    },
  });

  const handleLogin = () => login.mutate({ email: email.trim(), password });

  return (
    <ScreenContainer
      footer={
        <>
          <Button
            label="Log in"
            onPress={handleLogin}
            loading={login.isPending}
            disabled={!email.trim() || !password}
          />
          <Text style={styles.footerText}>
            New here?{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
              Create an account
            </Text>
          </Text>
        </>
      }
    >
      <View style={styles.logo}>
        <Ionicons name="school" size={24} color={COLORS.onAccent} />
      </View>

      <Text style={styles.title}>Study smarter,{'\n'}not longer.</Text>
      <Text style={styles.subtitle}>
        Turn your notes into flashcards and a daily plan that adapts to you.
      </Text>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Input
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={handleLogin}
        />
        {login.isError && getErrorCode(login.error) !== 'EMAIL_NOT_VERIFIED' ? (
          <ErrorText message={getErrorMessage(login.error)} />
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    ...TYPOGRAPHY.title,
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  form: {
    gap: SPACING.lg,
    marginTop: 32,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  link: {
    color: COLORS.accent,
  },
});
