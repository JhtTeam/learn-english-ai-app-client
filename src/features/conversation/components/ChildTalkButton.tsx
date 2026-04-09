import React, {memo, useCallback, useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@/hooks/useTheme';
import {AudioVisualizer} from './AudioVisualizer';
import type {AIConnectionState, AIPhase, InteractionMode} from '@/types';

interface Props {
  aiPhase: AIPhase;
  audioEnergy: number;
  connectionState: AIConnectionState;
  mode: InteractionMode;
  onTalkStart: () => void;
  onTalkEnd: () => void;
  onToggle: () => void;
  size?: number;
}

/**
 * Child-friendly talk button with NO text labels.
 * Communicates state purely through color, icons, and animation.
 *
 * Supports both auto_vad (tap toggle) and push_to_talk (hold) modes,
 * determined by parent Settings.
 */
export const ChildTalkButton = memo<Props>(
  ({aiPhase, audioEnergy, connectionState, mode, onTalkStart, onTalkEnd, onToggle, size = 160}) => {
    const theme = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

    const isConnected = connectionState === 'connected';
    const isConnecting = connectionState === 'connecting';
    const isListening = aiPhase === 'listening';
    const isBusy = aiPhase === 'thinking' || aiPhase === 'speaking';
    const isPTT = mode === 'push_to_talk';

    // Pulse animation when listening
    useEffect(() => {
      if (isListening) {
        pulseRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        );
        pulseRef.current.start();
      } else {
        pulseRef.current?.stop();
        pulseAnim.setValue(1);
      }
      return () => {
        pulseRef.current?.stop();
      };
    }, [isListening, pulseAnim]);

    const handlePressIn = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }).start();

      if (isPTT && isConnected && !isBusy) {
        onTalkStart();
      }
    }, [isPTT, isConnected, isBusy, onTalkStart, scaleAnim]);

    const handlePressOut = useCallback(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }).start();

      if (isPTT && isConnected) {
        onTalkEnd();
      }
    }, [isPTT, isConnected, onTalkEnd, scaleAnim]);

    const handlePress = useCallback(() => {
      if (!isPTT && isConnected && !isBusy) {
        onToggle();
      }
    }, [isPTT, isConnected, isBusy, onToggle]);

    const getButtonColor = () => {
      if (!isConnected && !isConnecting) return theme.colors.inactive;
      if (isConnecting) return theme.colors.warning;
      if (isListening) return theme.colors.error;
      if (isBusy) return theme.colors.border;
      return theme.colors.primary;
    };

    const getIcon = () => {
      if (isConnecting) return '\u{23F3}'; // hourglass
      if (isListening) return null; // show visualizer instead
      if (isBusy) return '\u{1F4AC}'; // speech bubble (AI is working)
      return '\u{1F3A4}'; // microphone
    };

    const icon = getIcon();

    return (
      <View style={styles.wrapper}>
        {/* Pulse ring */}
        {isListening && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: size + 40,
                height: size + 40,
                borderRadius: (size + 40) / 2,
                backgroundColor: theme.colors.error,
                opacity: 0.15,
                transform: [{scale: pulseAnim}],
              },
            ]}
          />
        )}

        {/* Main button */}
        <Animated.View style={{transform: [{scale: scaleAnim}]}}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            disabled={(!isConnected && !isConnecting) || isBusy}
            style={[
              styles.button,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: getButtonColor(),
              },
            ]}>
            {isListening ? (
              <AudioVisualizer energy={audioEnergy} active={true} color="#FFFFFF" size="large" />
            ) : icon ? (
              <Text style={[styles.icon, {fontSize: size * 0.3}]}>{icon}</Text>
            ) : null}
          </Pressable>
        </Animated.View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
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
});
