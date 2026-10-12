import { ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';

type Props = {
  children: ReactNode;
  /** Pinned to the bottom of the screen, above the keyboard */
  footer?: ReactNode;
  /**
   * Enables pull to refresh. The spinner shows only while a pull is in progress,
   * so background refetches never drive it (on iOS, toggling it while the screen
   * is hidden leaves the spinner stuck).
   */
  onRefresh?: () => Promise<unknown>;
};

export default function ScreenContainer({ children, footer, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.accent}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: SPACING.sm,
    gap: SPACING.lg,
  },
});
