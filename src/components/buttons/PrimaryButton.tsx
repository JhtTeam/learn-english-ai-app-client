import React, {memo, useCallback} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle} from 'react-native';
import {useTheme} from '@/hooks/useTheme';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const PrimaryButton = memo<Props>(
  ({
    title,
    onPress,
    disabled = false,
    loading = false,
    variant = 'primary',
    size = 'large',
    style,
  }) => {
    const theme = useTheme();

    const getBackgroundColor = useCallback(() => {
      if (disabled) return theme.colors.inactive;
      switch (variant) {
        case 'primary':
          return theme.colors.primary;
        case 'secondary':
          return theme.colors.secondary;
        case 'outline':
          return 'transparent';
      }
    }, [variant, disabled, theme]);

    const getTextColor = useCallback(() => {
      if (variant === 'outline') return theme.colors.primary;
      return theme.colors.textInverse;
    }, [variant, theme]);

    const sizeStyles: Record<string, ViewStyle> = {
      small: {paddingVertical: 8, paddingHorizontal: 16, borderRadius: theme.borderRadius.sm},
      medium: {paddingVertical: 12, paddingHorizontal: 24, borderRadius: theme.borderRadius.md},
      large: {paddingVertical: 16, paddingHorizontal: 32, borderRadius: theme.borderRadius.lg},
    };

    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({pressed}) => [
          styles.button,
          sizeStyles[size],
          {
            backgroundColor: getBackgroundColor(),
            opacity: pressed ? 0.8 : 1,
            borderWidth: variant === 'outline' ? 2 : 0,
            borderColor: theme.colors.primary,
          },
          style,
        ]}>
        {loading ? (
          <ActivityIndicator color={getTextColor()} />
        ) : (
          <Text
            style={[
              styles.text,
              theme.typography.button,
              {color: getTextColor()},
              size === 'small' && {fontSize: 14},
            ]}>
            {title}
          </Text>
        )}
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    textAlign: 'center',
  },
});
