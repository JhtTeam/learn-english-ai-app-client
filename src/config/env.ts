import Config from 'react-native-config';

export const ENV = {
  API_BASE_URL: Config.API_BASE_URL ?? 'https://api.example.com',
  GEMINI_API_KEY: Config.GEMINI_API_KEY ?? '',
  GEMINI_REALTIME_URL:
    Config.GEMINI_REALTIME_URL ??
    'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent',
  IS_DEV: Config.ENV === 'development',
  IS_PROD: Config.ENV === 'production',
} as const;
