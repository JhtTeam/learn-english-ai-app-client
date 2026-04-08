import {useCallback, useEffect, useRef} from 'react';
import {useStore} from '@/store';
import {audioRecorderService} from '@/services/audio/AudioRecorderService';
import type {AudioChunk, AudioRecorderConfig} from '@/types';

export function useAudioRecorder(onAudioData?: (chunk: AudioChunk) => void) {
  const audioState = useStore(state => state.audioState);
  const setAudioState = useStore(state => state.setAudioState);
  const onAudioDataRef = useRef(onAudioData);
  onAudioDataRef.current = onAudioData;

  useEffect(() => {
    const unsubState = audioRecorderService.onStateChange(state => {
      setAudioState(state);
    });

    const unsubAudio = audioRecorderService.onAudioData(chunk => {
      onAudioDataRef.current?.(chunk);
    });

    return () => {
      unsubState();
      unsubAudio();
    };
  }, [setAudioState]);

  const startRecording = useCallback(async (config?: Partial<AudioRecorderConfig>) => {
    await audioRecorderService.start(config);
  }, []);

  const stopRecording = useCallback(async () => {
    return audioRecorderService.stop();
  }, []);

  const toggleRecording = useCallback(async () => {
    if (audioState === 'recording') {
      return stopRecording();
    }
    return startRecording();
  }, [audioState, startRecording, stopRecording]);

  return {
    audioState,
    isRecording: audioState === 'recording',
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
