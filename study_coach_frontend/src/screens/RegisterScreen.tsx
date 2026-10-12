import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../api/client';
import { BackButton, Button, ErrorText, Input, ScreenContainer } from '../components';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { TYPOGRAPHY } from '../constants/typography';
import { useRegister } from '../hooks';
import { ScreenProps } from '../navigation/types';

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterScreen({ navigation }: ScreenProps<'Register'>) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const register = useRegister({
    onSuccess: (data) => navigation.navigate('VerifyEmail', { email: data.user.email }),
  });

  const canSubmit = !!name.trim() && !!email.trim() && password.length >= MIN_PASSWORD_LENGTH;

  const handleCreateAccount = () =>
    register.mutate({ name: name.trim(), email: email.trim(), password });

  return (
    <ScreenContainer
      footer={
        <>
          <Button
            label="Create account"
            onPress={handleCreateAccount}
            loading={register.isPending}
            disabled={!canSubmit}
          />
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
              Log in
            </Text>
          </Text>
        </>
      }
    >
      <BackButton />

      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>
        It takes a minute. We&apos;ll send a code to confirm your email.
      </Text>

      <View style={styles.form}>
        <Input
          label="Name"
          placeholder="Your name"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          textContentType="name"
        />
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
          placeholder="Create a password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        {register.isError ? <ErrorText message={getErrorMessage(register.error)} /> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
