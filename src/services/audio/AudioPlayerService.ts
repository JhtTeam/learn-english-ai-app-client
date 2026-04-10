import Tts from 'react-native-tts';
import {Platform} from 'react-native';
import {logger} from '@/utils/logger';
import type {AudioState, IAudioPlayerService} from '@/types';

const TAG = 'AudioPlayerService';

type StateChangeCallback = (state: AudioState) => void;

/**
 * Plays AI responses using the device's built-in TTS engine.
 *
 * Gemini returns text responses which are spoken aloud via react-native-tts.
 * Speaks primarily in English with Vietnamese support for the bilingual
 * teaching context.
 */
export class AudioPlayerService implements IAudioPlayerService {
  private state: AudioState = 'idle';
  private stateListeners: Set<StateChangeCallback> = new Set();
  private initialized = false;

  private init(): void {
    if (this.initialized) return;

    Tts.setDefaultLanguage('en-US');
    // Slower rate for young children learning English
    Tts.setDefaultRate(Platform.OS === 'ios' ? 0.45 : 0.85);
    Tts.setDefaultPitch(1.1);

    Tts.addEventListener('tts-start', () => {
      this.setState('playing');
    });

    Tts.addEventListener('tts-finish', () => {
      this.setState('idle');
    });

    Tts.addEventListener('tts-cancel', () => {
      this.setState('idle');
    });

    this.initialized = true;
    logger.info(TAG, 'TTS initialized');
  }

  speak(text: string): void {
    if (!text) return;
    this.init();
    Tts.speak(text);
    logger.debug(TAG, `Speaking: ${text.substring(0, 60)}`);
  }

  stop(): void {
    if (this.initialized) {
      Tts.stop();
    }
    this.setState('idle');
    logger.info(TAG, 'Stopped playback');
  }

  setVolume(_volume: number): void {
    // TTS volume is controlled by system volume
  }

  getState(): AudioState {
    return this.state;
  }

  onStateChange(callback: StateChangeCallback): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  dispose(): void {
    this.stop();
    this.stateListeners.clear();
  }

  private setState(newState: AudioState): void {
    this.state = newState;
    this.stateListeners.forEach(cb => cb(newState));
  }
}

export const audioPlayerService = new AudioPlayerService();
