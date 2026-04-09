import React, {memo, useCallback, useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@/hooks/useTheme';
import {AudioVisualizer} from './AudioVisualizer';
import type {AIConnectionState, InteractionMode} from '@/types';

interface Props {
  /** Whether the user is currently pressing/talking */
  isTalking: boolean;
  /** Current audio energy for visualization (0-1) */
  audioEnergy: number;
  /** AI connection state */
  connectionState: AIConnectionState;
  /** Current interaction mode */
  mode: InteractionMode;
  /** Called when user presses down (starts talking) */
  onTalkStart: () => void;
  /** Called when user releases (stops talking) */
  onTalkEnd: () => void;
  /** Toggle for tap-to-talk (auto_vad mode) */
  onToggle?: () => void;
  size?: number;
}

/**
 * Push-to-talk button with dual interaction modes:
 *
 * 1. push_to_talk: Press and hold to record. Release to send.
 *    Audio is streamed in real-time while held.
 *
 * 2. auto_vad: Tap to toggle listening. Server-side VAD
 *    handles turn detection automatically.
 *
 * Includes integrated AudioVisualizer for real-time feedback.
 */
export const PushToTalkButton = memo<Props>(
  ({
    isTalking,
    audioEnergy,
    connectionState,
    mode,
    onTalkStart,
    onTalkEnd,
    onToggle,
    size = 120,
  }) => {
    const theme = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

    const isConnected = connectionState === 'connected';
    const isConnecting = connectionState === 'connecting';
    const isPTT = mode === 'push_to_talk';

    // Pulse animation when talking
    useEffect(() => {
      if (isTalking) {
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
    }, [isTalking, pulseAnim]);

    const handlePressIn = useCallback(() => {
      // Scale down on press for tactile feedback
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }).start();

      if (isPTT && isConnected) {
        onTalkStart();
      }
    }, [isPTT, isConnected, onTalkStart, scaleAnim]);

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
      if (!isPTT) {
        onToggle?.();
      }
    }, [isPTT, onToggle]);

    const getButtonColor = () => {
      if (!isConnected && !isConnecting) return theme.colors.inactive;
      if (isConnecting) return theme.colors.warning;
      if (isTalking) return theme.colors.error;
      return theme.colors.primary;
    };

    const getLabel = () => {
      if (isConnecting) return 'Connecting...';
      if (!isConnected) return 'Not connected';
      if (isPTT) return isTalking ? 'Release to send' : 'Hold to talk';
      return isTalking ? 'Listening...' : 'Tap to listen';
    };

    const getIcon = () => {
      if (isConnecting) return '\u{23F3}'; // hourglass
      if (isTalking) return '\u{1F534}'; // red circle
      return '\u{1F3A4}'; // microphone
    };

    return (
      <View style={styles.wrapper}>
        {/* Pulse ring behind button */}
        {isTalking && (
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
            disabled={!isConnected && !isConnecting}
            style={[
              styles.button,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: getButtonColor(),
              },
            ]}>
            {/* Visualizer inside the button when talking */}
            {isTalking ? (
              <AudioVisualizer energy={audioEnergy} active={true} color="#FFFFFF" size="medium" />
            ) : (
              <Text style={[styles.icon, {fontSize: size * 0.3}]}>{getIcon()}</Text>
            )}
          </Pressable>
        </Animated.View>

        {/* Label below button */}
        <Text style={[theme.typography.caption, styles.label, {color: theme.colors.textSecondary}]}>
          {getLabel()}
        </Text>

        {/* Mode indicator */}
        <Text style={[styles.modeText, {color: theme.colors.inactive}]}>
          {isPTT ? 'Push-to-talk' : 'Auto detect'}
        </Text>
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
  label: {
    marginTop: 12,
  },
  modeText: {
    fontSize: 11,
    marginTop: 4,
  },
});
