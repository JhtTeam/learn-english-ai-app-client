import {mediaDevices, MediaStream} from 'react-native-webrtc';
import {logger} from '@/utils/logger';
import type {
  AudioChunk,
  AudioFrame,
  AudioRecorderConfig,
  AudioState,
  IAudioRecorderService,
} from '@/types';

const TAG = 'AudioRecorderService';

const DEFAULT_CONFIG: AudioRecorderConfig = {
  sampleRate: 24000,
  channels: 1,
  bitDepth: 16,
  encoding: 'pcm',
};

type AudioDataCallback = (chunk: AudioChunk) => void;
type AudioFrameCallback = (frame: AudioFrame) => void;
type StateChangeCallback = (state: AudioState) => void;

/**
 * Audio recorder that captures microphone input via WebRTC's getUserMedia.
 *
 * Provides two output paths:
 * 1. MediaStream — fed directly into RTCPeerConnection for low-latency streaming
 * 2. AudioFrames — raw PCM data for client-side VAD and visualization
 *
 * The MediaStream path is the primary architecture for OpenAI Realtime API.
 * Audio frames are tapped from the stream using AudioContext/ScriptProcessor
 * (or the polyfill from react-native-webrtc) for local processing only.
 */
export class AudioRecorderService implements IAudioRecorderService {
  private state: AudioState = 'idle';
  private config: AudioRecorderConfig = DEFAULT_CONFIG;
  private localStream: MediaStream | null = null;
  private audioDataListeners: Set<AudioDataCallback> = new Set();
  private audioFrameListeners: Set<AudioFrameCallback> = new Set();
  private stateChangeListeners: Set<StateChangeCallback> = new Set();
  private frameEmitterInterval: ReturnType<typeof setInterval> | null = null;

  async start(config?: Partial<AudioRecorderConfig>): Promise<void> {
    if (this.state === 'recording') {
      logger.warn(TAG, 'Already recording');
      return;
    }

    this.config = {...DEFAULT_CONFIG, ...config};
    logger.info(TAG, 'Starting recording', this.config);

    try {
      // Acquire microphone via WebRTC getUserMedia
      // This also triggers the native permission dialog on both iOS and Android
      this.localStream = (await mediaDevices.getUserMedia({
        audio: true,
      })) as unknown as MediaStream;

      this.startFrameEmitter();
      this.setState('recording');
      logger.info(TAG, 'Recording started with WebRTC media stream');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(TAG, 'Failed to start recording', err);
      this.setState('error');
      throw err;
    }
  }

  async stop(): Promise<string | null> {
    if (this.state !== 'recording' && this.state !== 'paused') {
      logger.warn(TAG, 'Not recording');
      return null;
    }

    logger.info(TAG, 'Stopping recording');
    this.stopFrameEmitter();

    // Stop all tracks on the media stream
    if (this.localStream) {
      const tracks = this.localStream.getTracks();
      for (const track of tracks) {
        track.stop();
      }
      this.localStream = null;
    }

    this.setState('idle');
    return null;
  }

  pause(): void {
    if (this.state !== 'recording') return;
    logger.info(TAG, 'Pausing recording');

    // Mute the audio track instead of stopping the stream
    // This keeps the WebRTC connection alive
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      for (const track of audioTracks) {
        track.enabled = false;
      }
    }

    this.setState('paused');
  }

  resume(): void {
    if (this.state !== 'paused') return;
    logger.info(TAG, 'Resuming recording');

    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      for (const track of audioTracks) {
        track.enabled = true;
      }
    }

    this.setState('recording');
  }

  getState(): AudioState {
    return this.state;
  }

  /**
   * Returns the raw MediaStream for direct attachment to RTCPeerConnection.
   * This is the low-latency path — audio goes directly from mic to WebRTC.
   */
  getMediaStream(): MediaStream | null {
    return this.localStream;
  }

  onAudioData(callback: AudioDataCallback): () => void {
    this.audioDataListeners.add(callback);
    return () => this.audioDataListeners.delete(callback);
  }

  onAudioFrame(callback: AudioFrameCallback): () => void {
    this.audioFrameListeners.add(callback);
    return () => this.audioFrameListeners.delete(callback);
  }

  onStateChange(callback: StateChangeCallback): () => void {
    this.stateChangeListeners.add(callback);
    return () => this.stateChangeListeners.delete(callback);
  }

  dispose(): void {
    logger.info(TAG, 'Disposing recorder');
    if (this.state === 'recording' || this.state === 'paused') {
      this.stop();
    }
    this.audioDataListeners.clear();
    this.audioFrameListeners.clear();
    this.stateChangeListeners.clear();
  }

  private setState(newState: AudioState): void {
    this.state = newState;
    this.stateChangeListeners.forEach(cb => cb(newState));
  }

  /**
   * Emits synthetic audio frames for VAD and visualization.
   *
   * In a full implementation, this would use AudioContext.createScriptProcessor
   * or an AnalyserNode to tap the real PCM data from the MediaStream.
   * react-native-webrtc doesn't expose raw PCM from getUserMedia directly,
   * so we use a polyfill approach:
   *
   * Option A: react-native-audio-api (AudioContext for RN)
   * Option B: Native module bridge that taps the audio pipeline
   * Option C: Use the WebRTC audio track stats for energy estimation
   *
   * For now, we emit frames at regular intervals that downstream consumers
   * (VAD, visualizer) can process. The actual PCM data will be populated
   * once the native audio tap module is integrated.
   */
  private startFrameEmitter(): void {
    this.stopFrameEmitter();

    // Emit frames at ~50fps for responsive visualization
    const frameDurationMs = 20;
    const samplesPerFrame = Math.floor((this.config.sampleRate * frameDurationMs) / 1000);

    this.frameEmitterInterval = setInterval(() => {
      if (this.state !== 'recording' || this.audioFrameListeners.size === 0) return;

      // Placeholder: will be replaced with actual PCM data from native tap
      const frame: AudioFrame = {
        pcmData: new Int16Array(samplesPerFrame),
        sampleRate: this.config.sampleRate,
        timestamp: Date.now(),
      };

      this.audioFrameListeners.forEach(cb => cb(frame));
    }, frameDurationMs);
  }

  private stopFrameEmitter(): void {
    if (this.frameEmitterInterval) {
      clearInterval(this.frameEmitterInterval);
      this.frameEmitterInterval = null;
    }
  }
}

export const audioRecorderService = new AudioRecorderService();
