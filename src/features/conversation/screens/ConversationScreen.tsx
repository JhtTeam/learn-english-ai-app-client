import React, {useCallback, useRef} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks/useTheme';
import {useConversation} from '@/store';
import {useAudioRecorder} from '@/hooks/useAudioRecorder';
import {usePermissions} from '@/hooks/usePermissions';
import {ScreenContainer} from '@/components/layout/ScreenContainer';
import {VoiceButton} from '../components/VoiceButton';
import {ConversationBubble} from '../components/ConversationBubble';
import type {HomeStackParamList} from '@/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Conversation'>;

export function ConversationScreen({route}: Props) {
  const theme = useTheme();
  const topic = route.params?.topic ?? 'Free Talk';
  const {messages, audioState, connectionState} = useConversation();
  const {toggleRecording} = useAudioRecorder();
  const {requestMicrophone, isMicGranted} = usePermissions();
  const listRef = useRef<FlatList>(null);

  const handleVoicePress = useCallback(async () => {
    if (!isMicGranted) {
      const status = await requestMicrophone();
      if (status !== 'granted') return;
    }
    await toggleRecording();
  }, [isMicGranted, requestMicrophone, toggleRecording]);

  return (
    <ScreenContainer edges={['bottom']}>
      {/* Topic Header */}
      <View style={[styles.topicBar, {backgroundColor: theme.colors.surface}]}>
        <Text style={[theme.typography.h3, {color: theme.colors.text}]}>{topic}</Text>
        <Text style={[theme.typography.caption, {color: theme.colors.textSecondary}]}>
          {connectionState === 'connected' ? 'AI is listening...' : 'Tap the mic to start'}
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({item}) => <ConversationBubble message={item} />}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({animated: true})}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{'🎤'}</Text>
            <Text
              style={[
                theme.typography.bodyLarge,
                {color: theme.colors.textSecondary, textAlign: 'center'},
              ]}>
              Press the microphone button{'\n'}and start speaking in English!
            </Text>
          </View>
        }
      />

      {/* Voice Button */}
      <View style={styles.voiceArea}>
        <VoiceButton state={audioState} onPress={handleVoicePress} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topicBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  messageList: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  voiceArea: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});
