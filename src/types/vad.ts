/** Voice Activity Detection types */

export type VADState = 'inactive' | 'listening' | 'speech_detected' | 'silence_after_speech';

export interface VADConfig {
  /** Energy threshold for speech detection (0-1 normalized). Default: 0.015 */
  energyThreshold: number;
  /** Duration of silence (ms) before considering speech ended. Default: 800 */
  silenceTimeout: number;
  /** Minimum speech duration (ms) to trigger detection. Default: 150 */
  minSpeechDuration: number;
  /** Size of the energy history buffer for smoothing. Default: 5 */
  smoothingWindowSize: number;
  /** Use server-side VAD from OpenAI when available. Default: true */
  preferServerVAD: boolean;
}

export const DEFAULT_VAD_CONFIG: VADConfig = {
  energyThreshold: 0.015,
  silenceTimeout: 800,
  minSpeechDuration: 150,
  smoothingWindowSize: 5,
  preferServerVAD: true,
};

export interface VADEvent {
  type: 'speech_start' | 'speech_end' | 'energy_update';
  timestamp: number;
  energy?: number;
}

export interface IVADService {
  start(config?: Partial<VADConfig>): void;
  stop(): void;
  /** Feed raw PCM audio data for analysis */
  processAudioFrame(pcmData: Float32Array | Int16Array): void;
  getState(): VADState;
  getCurrentEnergy(): number;
  onSpeechStart(callback: () => void): () => void;
  onSpeechEnd(callback: (durationMs: number) => void): () => void;
  onEnergyUpdate(callback: (energy: number) => void): () => void;
  dispose(): void;
}
