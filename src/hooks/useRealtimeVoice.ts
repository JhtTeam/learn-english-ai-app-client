import {useCallback, useEffect, useRef} from 'react';
import {Platform} from 'react-native';
import InCallManager from 'react-native-incall-manager';
import {useStore} from '@/store';
import {realtimeAIClient} from '@/services/ai/RealtimeAIClient';
import {audioPlayerService} from '@/services/audio/AudioPlayerService';
import {vadService} from '@/services/audio/VADService';
import {permissionService} from '@/services/permissions/PermissionService';
import {logger} from '@/utils/logger';
import type {AISessionConfig, InteractionMode} from '@/types';

const TAG = 'useRealtimeVoice';

/**
 * Main orchestration hook for real-time voice conversation.
 *
 * Wires together:
 *   RealtimeAIClient (WebRTC) ←→ AudioPlayerService (speaker)
 *                    ↕
 *   VADService (energy) → Store (UI state)
 *
 * Usage:
 *   const { connect, disconnect, startTalking, stopTalking } = useRealtimeVoice();
 */
export function useRealtimeVoice() {
  const setConnectionState = useStore(s => s.setConnectionState);
  const setIsTalking = useStore(s => s.setIsTalking);
  const setAudioEnergy = useStore(s => s.setAudioEnergy);
  const setVADState = useStore(s => s.setVADState);
  const addMessage = useStore(s => s.addMessage);
  const setStreamingTranscript = useStore(s => s.setStreamingTranscript);
  const setInteractionMode = useStore(s => s.setInteractionMode);
  const setAIPhase = useStore(s => s.setAIPhase);
  const connectionState = useStore(s => s.connectionState);
  const interactionMode = useStore(s => s.interactionMode);

  const cleanupRef = useRef<Array<() => void>>([]);

  // Wire up AI client event listeners
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      realtimeAIClient.onStateChange(state => {
        setConnectionState(state);
      }),
    );

    unsubs.push(
      realtimeAIClient.onMessage(message => {
        setStreamingTranscript('');
        addMessage(message);
      }),
    );

    unsubs.push(
      realtimeAIClient.onTranscript((transcript, isFinal) => {
        if (isFinal) {
          setStreamingTranscript('');
        } else {
          setStreamingTranscript(prev => prev + transcript);
        }
      }),
    );

    unsubs.push(
      realtimeAIClient.onRemoteStream(stream => {
        logger.info(TAG, 'Routing remote audio to player');
        audioPlayerService.attachStream(stream);
      }),
    );

    unsubs.push(
      realtimeAIClient.onAISpeakingStart(() => {
        setAIPhase('speaking');
      }),
    );

    unsubs.push(
      realtimeAIClient.onAISpeakingEnd(() => {
        setAIPhase('idle');
      }),
    );

    unsubs.push(
      realtimeAIClient.onError(error => {
        logger.error(TAG, 'AI client error', error);
      }),
    );

    cleanupRef.current = unsubs;

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [setConnectionState, addMessage, setStreamingTranscript, setAIPhase]);

  // Wire up VAD listeners
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      vadService.onEnergyUpdate(energy => {
        setAudioEnergy(energy);
      }),
    );

    unsubs.push(
      vadService.onSpeechStart(() => {
        setVADState('speech_detected');
      }),
    );

    unsubs.push(
      vadService.onSpeechEnd(() => {
        setVADState('listening');
      }),
    );

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [setAudioEnergy, setVADState]);

  const connect = useCallback(async (config?: Partial<AISessionConfig>) => {
    // Pre-flight permission check
    const micStatus = await permissionService.requestMicrophone();
    if (micStatus !== 'granted') {
      if (micStatus === 'blocked') {
        permissionService.showBlockedAlert('microphone');
      }
      logger.warn(TAG, `Microphone permission: ${micStatus}`);
      return;
    }

    // Route audio to loudspeaker (not earpiece) — critical for Android
    InCallManager.start({media: 'audio'});
    InCallManager.setForceSpeakerphoneOn(true);

    await realtimeAIClient.connect(config);
    vadService.start();
  }, []);

  const disconnect = useCallback(() => {
    realtimeAIClient.disconnect();
    audioPlayerService.stop();
    vadService.stop();
    InCallManager.setForceSpeakerphoneOn(false);
    InCallManager.stop();
    setIsTalking(false);
    setAudioEnergy(0);
    setVADState('inactive');
    setAIPhase('idle');
  }, [setIsTalking, setAudioEnergy, setVADState, setAIPhase]);

  const startTalking = useCallback(() => {
    setIsTalking(true);
    setAIPhase('listening');
    realtimeAIClient.startTalking();
  }, [setIsTalking, setAIPhase]);

  const stopTalking = useCallback(() => {
    setIsTalking(false);
    setAIPhase('thinking');
    realtimeAIClient.stopTalking();
  }, [setIsTalking, setAIPhase]);

  const toggleListening = useCallback(() => {
    // For auto_vad mode: toggle the mic on/off
    const talking = useStore.getState().isTalking;
    if (talking) {
      stopTalking();
    } else {
      startTalking();
    }
  }, [startTalking, stopTalking]);

  const switchMode = useCallback(
    (mode: InteractionMode) => {
      setInteractionMode(mode);
      realtimeAIClient.setInteractionMode(mode);

      // If switching while talking, stop
      if (useStore.getState().isTalking) {
        stopTalking();
      }
    },
    [setInteractionMode, stopTalking],
  );

  return {
    // State
    connectionState,
    interactionMode,

    // Actions
    connect,
    disconnect,
    startTalking,
    stopTalking,
    toggleListening,
    switchMode,
  };
}
