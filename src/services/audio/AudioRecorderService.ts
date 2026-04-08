import {logger} from '@/utils/logger';
import type {AudioChunk, AudioRecorderConfig, AudioState, IAudioRecorderService} from '@/types';

const TAG = 'AudioRecorderService';

const DEFAULT_CONFIG: AudioRecorderConfig = {
  sampleRate: 24000,
  channels: 1,
  bitDepth: 16,
  encoding: 'pcm',
};

type AudioDataCallback = (chunk: AudioChunk) => void;
type StateChangeCallback = (state: AudioState) => void;

/**
 * Audio recorder service that captures microphone input.
 *
 * Implementation will use react-native-live-audio-stream or
 * react-native-audio-recorder-player for actual recording.
 * This is the scalable interface — plug in the native module later.
 */
export class AudioRecorderService implements IAudioRecorderService {
  private state: AudioState = 'idle';
  private config: AudioRecorderConfig = DEFAULT_CONFIG;
  private audioDataListeners: Set<AudioDataCallback> = new Set();
  private stateChangeListeners: Set<StateChangeCallback> = new Set();

  async start(config?: Partial<AudioRecorderConfig>): Promise<void> {
    if (this.state === 'recording') {
      logger.warn(TAG, 'Already recording');
      return;
    }

    this.config = {...DEFAULT_CONFIG, ...config};
    logger.info(TAG, 'Starting recording', this.config);

    // TODO: Initialize native audio recording module
    // e.g., LiveAudioStream.init(this.config);
    // LiveAudioStream.start();

    this.setState('recording');
  }

  async stop(): Promise<string | null> {
    if (this.state !== 'recording' && this.state !== 'paused') {
      logger.warn(TAG, 'Not recording');
      return null;
    }

    logger.info(TAG, 'Stopping recording');

    // TODO: Stop native recording and return file path
    // const filePath = await LiveAudioStream.stop();

    this.setState('idle');
    return null; // Will return actual file path
  }

  pause(): void {
    if (this.state !== 'recording') return;
    logger.info(TAG, 'Pausing recording');
    this.setState('paused');
  }

  resume(): void {
    if (this.state !== 'paused') return;
    logger.info(TAG, 'Resuming recording');
    this.setState('recording');
  }

  getState(): AudioState {
    return this.state;
  }

  onAudioData(callback: AudioDataCallback): () => void {
    this.audioDataListeners.add(callback);
    return () => this.audioDataListeners.delete(callback);
  }

  onStateChange(callback: StateChangeCallback): () => void {
    this.stateChangeListeners.add(callback);
    return () => this.stateChangeListeners.delete(callback);
  }

  dispose(): void {
    logger.info(TAG, 'Disposing recorder');
    if (this.state === 'recording') {
      this.stop();
    }
    this.audioDataListeners.clear();
    this.stateChangeListeners.clear();
  }

  private setState(newState: AudioState): void {
    this.state = newState;
    this.stateChangeListeners.forEach(cb => cb(newState));
  }

  // Called by native module when audio data is available
  protected emitAudioData(chunk: AudioChunk): void {
    this.audioDataListeners.forEach(cb => cb(chunk));
  }
}

export const audioRecorderService = new AudioRecorderService();
