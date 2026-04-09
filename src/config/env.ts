import Config from 'react-native-config';

export const ENV = {
  API_BASE_URL: Config.API_BASE_URL ?? 'https://api.example.com',
  OPENAI_API_KEY: Config.OPENAI_API_KEY ?? '',
  // OpenAI Realtime API WebRTC endpoint (SDP exchange)
  OPENAI_REALTIME_URL: Config.OPENAI_REALTIME_URL ?? 'https://api.openai.com/v1/realtime',
  IS_DEV: Config.ENV === 'development',
  IS_PROD: Config.ENV === 'production',
} as const;
