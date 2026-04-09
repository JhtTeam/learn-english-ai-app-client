import React, {useCallback, useEffect} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks/useTheme';
import {useConversation, useStore} from '@/store';
import {useRealtimeVoice} from '@/hooks/useRealtimeVoice';
import {ScreenContainer} from '@/components/layout/ScreenContainer';
import {AICharacter} from '../components/AICharacter';
import {ChildTalkButton} from '../components/ChildTalkButton';
import type {HomeStackParamList} from '@/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Conversation'>;

export function ConversationScreen({route, navigation}: Props) {
  const theme = useTheme();
  const topicEmoji = route.params?.topicEmoji ?? '\u{1F3A4}';
  const {connectionState, interactionMode, aiPhase, audioEnergy} = useConversation();
  const preferredInteractionMode = useStore(s => s.preferredInteractionMode);

  const {connect, disconnect, startTalking, stopTalking, toggleListening, switchMode} =
    useRealtimeVoice();

  // Connect on mount, use preferred interaction mode
  useEffect(() => {
    switchMode(preferredInteractionMode);
    connect();
    return () => disconnect();
  }, [connect, disconnect, switchMode, preferredInteractionMode]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const statusColor =
    connectionState === 'connected'
      ? theme.colors.success
      : connectionState === 'connecting'
      ? theme.colors.warning
      : theme.colors.inactive;

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      {/* Minimal top bar: back + status dot + topic emoji */}
      <View style={styles.topBar}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={16}>
          <Text style={[styles.backIcon, {color: theme.colors.text}]}>{'\u{2190}'}</Text>
        </Pressable>

        <View style={styles.topCenter}>
          <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
          <Text style={styles.topicEmoji}>{topicEmoji}</Text>
        </View>

        {/* Spacer for alignment */}
        <View style={styles.backButton} />
      </View>

      {/* Central character area */}
      <View style={styles.characterArea}>
        <AICharacter phase={aiPhase} audioEnergy={audioEnergy} connectionState={connectionState} />
      </View>

      {/* Talk button */}
      <View style={styles.buttonArea}>
        <ChildTalkButton
          aiPhase={aiPhase}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
  },
  topCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  topicEmoji: {
    fontSize: 28,
  },
  characterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonArea: {
    alignItems: 'center',
    paddingBottom: 40,
  },
});
