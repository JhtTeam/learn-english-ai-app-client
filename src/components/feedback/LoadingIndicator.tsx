import React, {memo} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@/hooks/useTheme';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingIndicator = memo<Props>(({message, size = 'large'}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && (
        <Text style={[theme.typography.body, {color: theme.colors.textSecondary, marginTop: 12}]}>
          {message}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
