import React, {useCallback} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@/hooks/useTheme';
import {useStore} from '@/store';
import {ScreenContainer} from '@/components/layout/ScreenContainer';
import {PrimaryButton} from '@/components/buttons/PrimaryButton';

export function LoginScreen() {
  const theme = useTheme();
  const setUser = useStore(state => state.setUser);

  const handleLogin = useCallback(() => {
    // Placeholder login — replace with real auth
    setUser({
      id: '1',
      name: 'Little Star',
      level: 1,
      xp: 0,
    });
  }, [setUser]);

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.mascot}>{'🌟'}</Text>
        <Text style={[theme.typography.h1, {color: theme.colors.primary}]}>LearnEng</Text>
        <Text
          style={[theme.typography.bodyLarge, {color: theme.colors.textSecondary, marginTop: 8}]}>
          Learn English with your AI friend!
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Start Learning!" onPress={handleLogin} />
        <PrimaryButton
          title="I have an account"
          onPress={handleLogin}
          variant="outline"
          style={{marginTop: 16}}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  mascot: {
    fontSize: 80,
    marginBottom: 16,
  },
  actions: {
    paddingBottom: 48,
  },
});
