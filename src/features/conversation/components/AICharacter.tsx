import React, {memo, useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {useTheme} from '@/hooks/useTheme';
import {AudioVisualizer} from './AudioVisualizer';
import type {AIConnectionState, AIPhase} from '@/types';

interface Props {
  phase: AIPhase;
  audioEnergy: number;
  connectionState: AIConnectionState;
  size?: number;
}

const EYE_SIZE = 16;
const EYE_SPACING = 50;

/**
 * Animated character face that visually communicates AI state
 * to pre-literate children. No text — only shapes, colors, animations.
 *
 * Phases:
 *   idle      → soft green, gentle breathing, blinking eyes
 *   listening → bright green, mouth = AudioVisualizer driven by user energy
 *   thinking  → amber, eyes look around, bouncing dots mouth
 *   speaking  → blue, happy eyes, mouth = AudioVisualizer with sine oscillation
 *   (connecting) → gray, eyes closed, subtle pulse
 */
export const AICharacter = memo<Props>(({phase, audioEnergy, connectionState, size = 220}) => {
  const theme = useTheme();

  // Animation values
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;
  const eyeLookAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const speakEnergyAnim = useRef(new Animated.Value(0.3)).current;
  const breatheRef = useRef<Animated.CompositeAnimation | null>(null);
  const blinkRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowRef = useRef<Animated.CompositeAnimation | null>(null);
  const thinkRef = useRef<Animated.CompositeAnimation | null>(null);
  const speakRef = useRef<Animated.CompositeAnimation | null>(null);

  const isConnecting = connectionState === 'connecting';
  const isDisconnected = connectionState === 'disconnected' || connectionState === 'error';

  // Determine visual state
  const effectivePhase = isConnecting || isDisconnected ? 'connecting' : phase;

  // --- Breathing animation (always running when idle/listening) ---
  useEffect(() => {
    breatheRef.current?.stop();
    if (effectivePhase === 'idle' || effectivePhase === 'connecting') {
      breatheRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1.04,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      );
      breatheRef.current.start();
    } else {
      breatheAnim.setValue(1);
    }
    return () => breatheRef.current?.stop();
  }, [effectivePhase, breatheAnim]);

  // --- Blink animation ---
  useEffect(() => {
    blinkRef.current?.stop();
    if (
      effectivePhase === 'idle' ||
      effectivePhase === 'listening' ||
      effectivePhase === 'speaking'
    ) {
      const runBlink = () => {
        blinkRef.current = Animated.sequence([
          Animated.delay(2000 + Math.random() * 3000),
          Animated.timing(blinkAnim, {
            toValue: 0.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]);
        blinkRef.current.start(({finished}) => {
          if (finished) {
            runBlink();
          }
        });
      };
      runBlink();
    } else if (effectivePhase === 'connecting') {
      blinkAnim.setValue(0.1); // eyes closed
    } else {
      blinkAnim.setValue(1);
    }
    return () => blinkRef.current?.stop();
  }, [effectivePhase, blinkAnim]);

  // --- Glow ring animation ---
  useEffect(() => {
    glowRef.current?.stop();
    glowRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.15,
          duration: effectivePhase === 'speaking' ? 800 : 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: effectivePhase === 'speaking' ? 800 : 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    glowRef.current.start();
    return () => glowRef.current?.stop();
  }, [effectivePhase, glowAnim]);

  // --- Thinking: eye look around + bouncing dots ---
  useEffect(() => {
    thinkRef.current?.stop();
    if (effectivePhase === 'thinking') {
      // Eye look animation
      thinkRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(eyeLookAnim, {
            toValue: 8,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(eyeLookAnim, {
            toValue: -8,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(eyeLookAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      thinkRef.current.start();

      // Bouncing dots
      const dotBounce = (anim: Animated.Value, delay: number): Animated.CompositeAnimation =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: -8,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        );
      dotBounce(dot1Anim, 0).start();
      dotBounce(dot2Anim, 150).start();
      dotBounce(dot3Anim, 300).start();
    } else {
      eyeLookAnim.setValue(0);
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
    }
    return () => {
      thinkRef.current?.stop();
    };
  }, [effectivePhase, eyeLookAnim, dot1Anim, dot2Anim, dot3Anim]);

  // --- Speaking: sine wave energy for mouth ---
  useEffect(() => {
    speakRef.current?.stop();
    if (effectivePhase === 'speaking') {
      speakRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(speakEnergyAnim, {
            toValue: 0.9,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(speakEnergyAnim, {
            toValue: 0.2,
            duration: 200 + Math.random() * 200,
            useNativeDriver: false,
          }),
          Animated.timing(speakEnergyAnim, {
            toValue: 0.7,
            duration: 250 + Math.random() * 150,
            useNativeDriver: false,
          }),
          Animated.timing(speakEnergyAnim, {
            toValue: 0.3,
            duration: 300 + Math.random() * 200,
            useNativeDriver: false,
          }),
        ]),
      );
      speakRef.current.start();
    } else {
      speakEnergyAnim.setValue(0);
    }
    return () => speakRef.current?.stop();
  }, [effectivePhase, speakEnergyAnim]);

  // --- Colors by phase ---
  const getFaceColor = () => {
    switch (effectivePhase) {
      case 'listening':
        return theme.colors.primary;
      case 'thinking':
        return '#FFA726'; // amber
      case 'speaking':
        return '#42A5F5'; // blue
      case 'connecting':
        return theme.colors.inactive;
      default:
        return theme.colors.primaryLight;
    }
  };

  const getGlowColor = () => {
    switch (effectivePhase) {
      case 'listening':
        return theme.colors.primary;
      case 'thinking':
        return '#FFB74D';
      case 'speaking':
        return '#64B5F6';
      case 'connecting':
        return theme.colors.inactive;
      default:
        return theme.colors.primaryLight;
    }
  };

  const getEyeStyle = () => {
    if (effectivePhase === 'speaking') {
      // Happy squint eyes
      return {height: EYE_SIZE * 0.5, borderRadius: EYE_SIZE};
    }
    if (effectivePhase === 'listening') {
      // Wide open eyes
      return {height: EYE_SIZE * 1.2, width: EYE_SIZE * 1.2, borderRadius: EYE_SIZE * 0.6};
    }
    return {height: EYE_SIZE, borderRadius: EYE_SIZE / 2};
  };

  // --- Render mouth based on phase ---
  const renderMouth = () => {
    if (effectivePhase === 'thinking') {
      // 3 bouncing dots
      return (
        <View style={styles.dotsContainer}>
          {[dot1Anim, dot2Anim, dot3Anim].map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: '#FFFFFF',
                  transform: [{translateY: anim}],
                },
              ]}
            />
          ))}
        </View>
      );
    }

    if (effectivePhase === 'listening') {
      return <AudioVisualizer energy={audioEnergy} active={true} color="#FFFFFF" size="large" />;
    }

    if (effectivePhase === 'speaking') {
      return <SpeakingMouth energyAnim={speakEnergyAnim} />;
    }

    // idle / connecting: small smile (low-energy bars)
    return <AudioVisualizer energy={0.15} active={true} color="#FFFFFF" size="medium" />;
  };

  return (
    <View style={styles.wrapper}>
      {/* Glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size + 40,
            height: size + 40,
            borderRadius: (size + 40) / 2,
            backgroundColor: getGlowColor(),
            opacity: 0.2,
            transform: [{scale: glowAnim}],
          },
        ]}
      />

      {/* Face */}
      <Animated.View
        style={[
          styles.face,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: getFaceColor(),
            transform: [{scale: breatheAnim}],
          },
        ]}>
        {/* Eyes */}
        <View style={styles.eyesContainer}>
          <Animated.View
            style={[
              styles.eye,
              getEyeStyle(),
              {
                backgroundColor: '#FFFFFF',
                transform: [{translateX: eyeLookAnim}, {scaleY: blinkAnim}],
                marginRight: EYE_SPACING,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.eye,
              getEyeStyle(),
              {
                backgroundColor: '#FFFFFF',
                transform: [{translateX: eyeLookAnim}, {scaleY: blinkAnim}],
              },
            ]}
          />
        </View>

        {/* Mouth */}
        <View style={styles.mouthContainer}>{renderMouth()}</View>
      </Animated.View>
    </View>
  );
});

/**
 * Speaking mouth component that reads from an Animated.Value
 * to drive the AudioVisualizer with simulated speech energy.
 */
function SpeakingMouth({energyAnim}: {energyAnim: Animated.Value}) {
  const [energy, setEnergy] = React.useState(0.3);

  useEffect(() => {
    const id = energyAnim.addListener(({value}) => {
      setEnergy(value);
    });
    return () => energyAnim.removeListener(id);
  }, [energyAnim]);

  return <AudioVisualizer energy={energy} active={true} color="#FFFFFF" size="large" />;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  eyesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  eye: {
    width: EYE_SIZE,
  },
  mouthContainer: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
