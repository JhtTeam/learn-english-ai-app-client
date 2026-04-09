import {logger} from '@/utils/logger';
import type {IVADService, VADConfig, VADState} from '@/types';
import {DEFAULT_VAD_CONFIG} from '@/types';

const TAG = 'VADService';

type SpeechStartCallback = () => void;
type SpeechEndCallback = (durationMs: number) => void;
type EnergyUpdateCallback = (energy: number) => void;

/**
 * Client-side Voice Activity Detection using audio energy analysis.
 *
 * Processes raw PCM audio frames to detect speech onset/offset.
 * Works alongside server-side VAD from OpenAI Realtime API —
 * client-side is used for immediate UI feedback (visualization, button state),
 * while server-side handles actual turn detection for the AI.
 */
export class VADService implements IVADService {
  private state: VADState = 'inactive';
  private config: VADConfig = DEFAULT_VAD_CONFIG;
  private currentEnergy = 0;
  private energyHistory: number[] = [];
  private speechStartTime: number | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private active = false;

  private speechStartListeners: Set<SpeechStartCallback> = new Set();
  private speechEndListeners: Set<SpeechEndCallback> = new Set();
  private energyUpdateListeners: Set<EnergyUpdateCallback> = new Set();

  start(config?: Partial<VADConfig>): void {
    this.config = {...DEFAULT_VAD_CONFIG, ...config};
    this.active = true;
    this.state = 'listening';
    this.energyHistory = [];
    this.currentEnergy = 0;
    logger.info(TAG, 'Started', this.config);
  }

  stop(): void {
    this.active = false;
    this.clearSilenceTimer();
    this.state = 'inactive';
    this.currentEnergy = 0;
    this.speechStartTime = null;
    logger.info(TAG, 'Stopped');
  }

  processAudioFrame(pcmData: Float32Array | Int16Array): void {
    if (!this.active) return;

    const energy = this.computeRMSEnergy(pcmData);
    this.updateEnergy(energy);

    const smoothedEnergy = this.getSmoothedEnergy();
    const isSpeech = smoothedEnergy > this.config.energyThreshold;

    switch (this.state) {
      case 'listening':
        if (isSpeech) {
          this.speechStartTime = Date.now();
          this.state = 'speech_detected';
          logger.debug(TAG, `Speech started (energy: ${smoothedEnergy.toFixed(4)})`);
          this.speechStartListeners.forEach(cb => cb());
        }
        break;

      case 'speech_detected':
        if (!isSpeech) {
          this.state = 'silence_after_speech';
          this.startSilenceTimer();
        }
        break;

      case 'silence_after_speech':
        if (isSpeech) {
          // Speech resumed — cancel silence timer
          this.clearSilenceTimer();
          this.state = 'speech_detected';
        }
        break;
    }
  }

  getState(): VADState {
    return this.state;
  }

  getCurrentEnergy(): number {
    return this.currentEnergy;
  }

  onSpeechStart(callback: SpeechStartCallback): () => void {
    this.speechStartListeners.add(callback);
    return () => this.speechStartListeners.delete(callback);
  }

  onSpeechEnd(callback: SpeechEndCallback): () => void {
    this.speechEndListeners.add(callback);
    return () => this.speechEndListeners.delete(callback);
  }

  onEnergyUpdate(callback: EnergyUpdateCallback): () => void {
    this.energyUpdateListeners.add(callback);
    return () => this.energyUpdateListeners.delete(callback);
  }

  dispose(): void {
    this.stop();
    this.speechStartListeners.clear();
    this.speechEndListeners.clear();
    this.energyUpdateListeners.clear();
  }

  /**
   * Compute RMS energy from PCM audio data.
   * Returns normalized value 0-1.
   */
  private computeRMSEnergy(pcmData: Float32Array | Int16Array): number {
    if (pcmData.length === 0) return 0;

    let sumSquares = 0;

    if (pcmData instanceof Int16Array) {
      // PCM16: normalize to -1..1 range
      for (let i = 0; i < pcmData.length; i++) {
        const normalized = pcmData[i] / 32768;
        sumSquares += normalized * normalized;
      }
    } else {
      for (let i = 0; i < pcmData.length; i++) {
        sumSquares += pcmData[i] * pcmData[i];
      }
    }

    return Math.sqrt(sumSquares / pcmData.length);
  }

  private updateEnergy(energy: number): void {
    this.currentEnergy = energy;
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.config.smoothingWindowSize) {
      this.energyHistory.shift();
    }
    this.energyUpdateListeners.forEach(cb => cb(energy));
  }

  private getSmoothedEnergy(): number {
    if (this.energyHistory.length === 0) return 0;
    const sum = this.energyHistory.reduce((a, b) => a + b, 0);
    return sum / this.energyHistory.length;
  }

  private startSilenceTimer(): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      const duration = this.speechStartTime ? Date.now() - this.speechStartTime : 0;

      if (duration >= this.config.minSpeechDuration) {
        logger.debug(TAG, `Speech ended (duration: ${duration}ms)`);
        this.speechEndListeners.forEach(cb => cb(duration));
      }

      this.speechStartTime = null;
      this.state = 'listening';
    }, this.config.silenceTimeout);
  }

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}

export const vadService = new VADService();
