import {MediaStream} from 'react-native-webrtc';
import {logger} from '@/utils/logger';
import type {AudioState, IAudioPlayerService} from '@/types';

const TAG = 'AudioPlayerService';

type StateChangeCallback = (state: AudioState) => void;

/**
 * Plays audio received from the AI via WebRTC remote track.
 *
 * In WebRTC mode, the remote audio track plays automatically through
 * the device speaker — this service manages that state and provides
 * a fallback path for base64 PCM chunk playback (e.g. via WebSocket).
 *
 * Uses react-native-webrtc's MediaStream for the primary path.
 */
export class AudioPlayerService implements IAudioPlayerService {
  private state: AudioState = 'idle';
  private volume = 1.0;
  private remoteStream: MediaStream | null = null;
  private stateListeners: Set<StateChangeCallback> = new Set();

  /**
   * Play a base64-encoded PCM audio chunk.
   * Fallback path when not using WebRTC direct audio.
   */
  playChunk(audioData: string): void {
    if (!audioData) return;

    // In WebRTC mode, remote audio plays automatically via the
    // RTCPeerConnection ontrack handler. This method is the fallback
    // for WebSocket-based audio delivery.
    //
    // Implementation: decode base64 → write to AudioTrack/AudioQueue
    // Will integrate with react-native-audio-api or expo-av

    this.setState('playing');
    logger.debug(TAG, `Playing audio chunk (${audioData.length} bytes base64)`);
  }

  /**
   * Attach a WebRTC remote MediaStream for automatic playback.
   * This is the primary low-latency path.
   */
  attachStream(stream: MediaStream): void {
    this.remoteStream = stream;
    this.setState('playing');
    logger.info(TAG, 'Attached remote audio stream');

    // In react-native-webrtc, attaching the stream to an RTCView
    // or simply having it as a remote track is enough for playback.
    // The audio plays through the device speaker automatically.
  }

  stop(): void {
    this.remoteStream = null;
    this.setState('idle');
    logger.info(TAG, 'Stopped playback');
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    // Apply volume to active audio track if available
    if (this.remoteStream) {
      const audioTracks = this.remoteStream.getAudioTracks();
      audioTracks.forEach(track => {
        // react-native-webrtc tracks support enabled toggle
        track.enabled = this.volume > 0;
      });
    }
    logger.debug(TAG, `Volume set to ${this.volume}`);
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
