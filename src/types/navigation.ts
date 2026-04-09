import type {NavigatorScreenParams} from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  LessonsTab: undefined;
  SettingsTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Conversation: {lessonId?: string; topic?: string; topicEmoji?: string};
};

export type LessonStackParamList = {
  Lessons: undefined;
  LessonDetail: {lessonId: string};
  Conversation: {lessonId: string; topic: string; topicEmoji?: string};
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
