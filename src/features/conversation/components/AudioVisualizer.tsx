import React, {memo, useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {useTheme} from '@/hooks/useTheme';

const BAR_COUNT = 5;
const BAR_WIDTH = 4;
const BAR_GAP = 3;
const MAX_HEIGHT = 40;
const MIN_HEIGHT = 4;

interface Props {
  /** Normalized audio energy level 0-1 */
  energy: number;
  /** Whether the visualizer is active */
  active: boolean;
  /** Color override for bars */
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Real-time audio visualization using animated bars.
 *
 * Driven by audio energy from VADService — each bar's height is
 * derived from the current energy level with per-bar variation
 * to create organic movement. Uses native-driven animations
 * for 60fps performance without JS thread overhead.
 */
export const AudioVisualizer = memo<Props>(({energy, active, color, size = 'medium'}) => {
  const theme = useTheme();
  const barAnims = useRef(
    Array.from({length: BAR_COUNT}, () => new Animated.Value(MIN_HEIGHT)),
  ).current;

  const scale = size === 'small' ? 0.6 : size === 'large' ? 1.4 : 1;
  const barColor = color ?? theme.colors.primary;

  useEffect(() => {
    if (!active) {
      // Reset all bars to minimum
      barAnims.forEach(anim => {
        Animated.timing(anim, {
          toValue: MIN_HEIGHT,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    // Map energy to bar heights with per-bar variation
    const animations = barAnims.map((anim, i) => {
      // Center bars are taller, edges shorter — creates a "mouth" shape
      const centerWeight = 1 - Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
      const variation = 0.5 + centerWeight * 0.5;
      const targetHeight = MIN_HEIGHT + energy * (MAX_HEIGHT - MIN_HEIGHT) * variation;

      return Animated.spring(anim, {
        toValue: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, targetHeight)),
        tension: 200,
        friction: 12,
        useNativeDriver: false,
      });
    });

    Animated.parallel(animations).start();
  }, [energy, active, barAnims]);

  return (
    <View style={[styles.container, {transform: [{scale}]}]}>
      {barAnims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: anim,
              backgroundColor: active ? barColor : theme.colors.inactive,
              opacity: active ? 1 : 0.4,
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: BAR_GAP,
    height: MAX_HEIGHT,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
});
