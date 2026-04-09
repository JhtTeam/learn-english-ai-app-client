import React, {useCallback} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View, type ViewStyle} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks/useTheme';
import {useStore} from '@/store';
import {ScreenContainer} from '@/components/layout/ScreenContainer';
import type {HomeStackParamList} from '@/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

const TOPIC_COLORS = [
  '#E8F5E9', // light green
  '#FFF3E0', // light orange
  '#E3F2FD', // light blue
  '#FCE4EC', // light pink
  '#F3E5F5', // light purple
];

const SAMPLE_TOPICS = [
  {id: '1', title: 'Greetings', icon: '\u{1F44B}', progress: 60},
  {id: '2', title: 'Animals', icon: '\u{1F436}', progress: 30},
  {id: '3', title: 'Colors', icon: '\u{1F308}', progress: 0},
  {
    id: '4',
    title: 'Family',
    icon: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}',
    progress: 0,
  },
  {id: '5', title: 'Food', icon: '\u{1F355}', progress: 0},
];

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const user = useStore(state => state.user);

  const handleFreeConversation = useCallback(() => {
    navigation.navigate('Conversation', {topic: 'Free Talk', topicEmoji: '\u{1F3A4}'});
  }, [navigation]);

  const handleTopicPress = useCallback(
    (topic: string, emoji: string) => {
      navigation.navigate('Conversation', {topic, topicEmoji: emoji});
    },
    [navigation],
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <Text style={[theme.typography.h2, {color: theme.colors.text}]}>
          Hi, {user?.name ?? 'Friend'}! {'\u{1F44B}'}
        </Text>

        {/* Big Free Talk button */}
        <Pressable
          onPress={handleFreeConversation}
          style={({pressed}) => [
            styles.freeTalkButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.xl,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <Text style={styles.freeTalkIcon}>{'\u{1F3A4}'}</Text>
          <Text style={[theme.typography.h3, {color: theme.colors.white}]}>Free Talk</Text>
        </Pressable>

        <Text
          style={[theme.typography.h3, {color: theme.colors.text, marginTop: 24, marginBottom: 4}]}>
          Topics
        </Text>
      </View>
    ),
    [theme, user, handleFreeConversation],
  );

  return (
    <ScreenContainer>
      <FlatList
        data={SAMPLE_TOPICS}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({item, index}) => (
          <TopicCard
            title={item.title}
            icon={item.icon}
            progress={item.progress}
            bgColor={TOPIC_COLORS[index % TOPIC_COLORS.length]}
            onPress={() => handleTopicPress(item.title, item.icon)}
          />
        )}
      />
    </ScreenContainer>
  );
}

interface TopicCardProps {
  title: string;
  icon: string;
  progress: number;
  bgColor: string;
  onPress: () => void;
  style?: ViewStyle;
}

function TopicCard({title, icon, progress, bgColor, onPress}: TopicCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.topicCard,
        {
          backgroundColor: bgColor,
          borderRadius: theme.borderRadius.lg,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <Text style={styles.topicIcon}>{icon}</Text>
      <Text
        style={[theme.typography.caption, styles.topicTitle, {color: theme.colors.text}]}
        numberOfLines={1}>
        {title}
      </Text>
      {progress > 0 && (
        <View style={[styles.progressBar, {backgroundColor: theme.colors.border}]}>
          <View
            style={[
              styles.progressFill,
              {width: `${progress}%`, backgroundColor: theme.colors.primary},
            ]}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 24,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  freeTalkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 20,
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  freeTalkIcon: {
    fontSize: 36,
  },
  topicCard: {
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topicIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  topicTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
