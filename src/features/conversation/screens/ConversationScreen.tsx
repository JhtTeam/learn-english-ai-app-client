import React, {useCallback, useEffect, useRef} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks/useTheme';
import {useConversation} from '@/store';
import {useRealtimeVoice} from '@/hooks/useRealtimeVoice';
import {ScreenContainer} from '@/components/layout/ScreenContainer';
import {PushToTalkButton} from '../components/PushToTalkButton';
import {AudioVisualizer} from '../components/AudioVisualizer';
import {ConversationBubble} from '../components/ConversationBubble';
import type {HomeStackParamList} from '@/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Conversation'>;

export function ConversationScreen({route}: Props) {
  const theme = useTheme();
  const topic = route.params?.topic ?? 'Free Talk';
  const {messages, connectionState, interactionMode, isTalking, audioEnergy, streamingTranscript} =
    useConversation();

  const {connect, disconnect, startTalking, stopTalking, toggleListening, switchMode} =
    useRealtimeVoice();

  const listRef = useRef<FlatList>(null);

  // Connect to AI on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleModeToggle = useCallback(() => {
    switchMode(interactionMode === 'push_to_talk' ? 'auto_vad' : 'push_to_talk');
  }, [interactionMode, switchMode]);

  return (
    <ScreenContainer edges={['bottom']}>
      {/* Topic Header */}
      <View style={[styles.topicBar, {backgroundColor: theme.colors.surface}]}>
        <View style={styles.topicRow}>
          <Text style={[theme.typography.h3, {color: theme.colors.text}]}>{topic}</Text>
          {connectionState === 'connected' && (
            <AudioVisualizer energy={isTalking ? audioEnergy : 0} active={isTalking} size="small" />
          )}
        </View>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  connectionState === 'connected'
                    ? theme.colors.success
                    : connectionState === 'connecting'
                    ? theme.colors.warning
                    : theme.colors.inactive,
              },
            ]}
          />
          <Text style={[theme.typography.caption, {color: theme.colors.textSecondary}]}>
            {connectionState === 'connected'
              ? 'AI connected'
              : connectionState === 'connecting'
              ? 'Connecting...'
              : 'Disconnected'}
          </Text>

          {/* Mode toggle */}
          {connectionState === 'connected' && (
            <Pressable onPress={handleModeToggle} style={styles.modeToggle}>
              <Text style={[styles.modeToggleText, {color: theme.colors.accent}]}>
                {interactionMode === 'push_to_talk' ? 'Switch to Auto' : 'Switch to PTT'}
              </Text>
            </Pressable>
          )}
        </View>
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
        ListFooterComponent={
          streamingTranscript ? (
            <View style={[styles.streamingBubble, {backgroundColor: theme.colors.surface}]}>
              <Text style={[theme.typography.body, {color: theme.colors.textSecondary}]}>
                {streamingTranscript}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{'\u{1F3A4}'}</Text>
            <Text
              style={[
                theme.typography.bodyLarge,
                {color: theme.colors.textSecondary, textAlign: 'center'},
              ]}>
              {connectionState === 'connected'
                ? interactionMode === 'push_to_talk'
                  ? 'Hold the button below\nand start speaking in English!'
                  : 'Tap the button below\nand start speaking in English!'
                : 'Connecting to AI...'}
            </Text>
          </View>
        }
      />

      {/* Push-to-talk / voice button area */}
      <View style={styles.voiceArea}>
        <PushToTalkButton
          isTalking={isTalking}
          audioEnergy={audioEnergy}
          connectionState={connectionState}
          mode={interactionMode}
          onTalkStart={startTalking}
          onTalkEnd={stopTalking}
          onToggle={toggleListening}
        />
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
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  modeToggle: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageList: {
    flexGrow: 1,
    paddingVertical: 16,
  },
  streamingBubble: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    opacity: 0.7,
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
