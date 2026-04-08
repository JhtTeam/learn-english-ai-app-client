import React, {memo, useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@/hooks/useTheme';
import type {AudioState} from '@/types';

interface Props {
  state: AudioState;
  onPress: () => void;
  size?: number;
}

export const VoiceButton = memo<Props>(({state, onPress, size = 120}) => {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'recording') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  const isRecording = state === 'recording';
  const buttonColor = isRecording ? theme.colors.error : theme.colors.primary;
  const iconText = isRecording ? '||' : '\u{1F3A4}';

  return (
    <View style={styles.wrapper}>
      {isRecording && (
        <Animated.View
          style={[
            styles.pulse,
            {
              width: size + 30,
              height: size + 30,
              borderRadius: (size + 30) / 2,
              backgroundColor: theme.colors.error,
              opacity: 0.2,
              transform: [{scale: pulseAnim}],
            },
          ]}
        />
      )}
      <Pressable
        onPress={onPress}
        style={({pressed}) => [
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: buttonColor,
            opacity: pressed ? 0.8 : 1,
          },
        ]}>
        <Text style={[styles.icon, {fontSize: size * 0.35}]}>{iconText}</Text>
        <Text style={[theme.typography.caption, styles.label, {color: theme.colors.textInverse}]}>
          {isRecording ? 'Tap to stop' : 'Tap to talk'}
        </Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  icon: {
    color: '#FFFFFF',
  },
  label: {
    marginTop: 4,
  },
});
