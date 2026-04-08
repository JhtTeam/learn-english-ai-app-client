import React, {memo} from 'react';
import {Pressable, StyleSheet, Text, type ViewStyle} from 'react-native';
import {useTheme} from '@/hooks/useTheme';

interface Props {
  icon: string; // emoji or text icon (replace with vector icons later)
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton = memo<Props>(
  ({icon, onPress, size = 56, color, backgroundColor, disabled = false, style}) => {
    const theme = useTheme();

    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({pressed}) => [
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: backgroundColor ?? theme.colors.primary,
            opacity: pressed ? 0.7 : disabled ? 0.5 : 1,
          },
          style,
        ]}>
        <Text
          style={[styles.icon, {fontSize: size * 0.4, color: color ?? theme.colors.textInverse}]}>
          {icon}
        </Text>
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  icon: {
    textAlign: 'center',
  },
});
