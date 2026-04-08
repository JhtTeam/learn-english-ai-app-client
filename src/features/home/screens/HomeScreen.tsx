import React, {useCallback} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks/useTheme';
import {useStore} from '@/store';
import {ScreenContainer} from '@/components/layout/ScreenContainer';
import {PrimaryButton} from '@/components/buttons/PrimaryButton';
import {LessonCard} from '@/components/cards/LessonCard';
import type {HomeStackParamList} from '@/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

const SAMPLE_TOPICS = [
  {
    id: '1',
    title: 'Greetings',
    description: 'Say hello and introduce yourself',
    icon: '👋',
    progress: 60,
  },
  {
    id: '2',
    title: 'Animals',
    description: 'Learn about your favorite animals',
    icon: '🐶',
    progress: 30,
  },
  {
    id: '3',
    title: 'Colors',
    description: 'Discover the rainbow of colors',
    icon: '🌈',
    progress: 0,
  },
  {id: '4', title: 'Family', description: 'Talk about your family', icon: '👨‍👩‍👧‍👦', progress: 0},
  {id: '5', title: 'Food', description: 'Yummy foods and drinks', icon: '🍕', progress: 0},
];

export function HomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const user = useStore(state => state.user);

  const handleFreeConversation = useCallback(() => {
    navigation.navigate('Conversation', {topic: 'Free Talk'});
  }, [navigation]);

  const handleTopicPress = useCallback(
    (topic: string) => {
      navigation.navigate('Conversation', {topic});
    },
    [navigation],
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <View>
          <Text style={[theme.typography.h2, {color: theme.colors.text}]}>
            Hi, {user?.name ?? 'Friend'}! 👋
          </Text>
          <Text style={[theme.typography.body, {color: theme.colors.textSecondary, marginTop: 4}]}>
            Ready to practice English today?
          </Text>
        </View>

        <PrimaryButton
          title="🎤  Free Talk"
          onPress={handleFreeConversation}
          size="large"
          style={{marginTop: 24, marginBottom: 8}}
        />

        <Text
          style={[theme.typography.h3, {color: theme.colors.text, marginTop: 24, marginBottom: 8}]}>
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
        renderItem={({item}) => (
          <LessonCard
            title={item.title}
            description={item.description}
            icon={item.icon}
            progress={item.progress}
            onPress={() => handleTopicPress(item.title)}
            style={{marginBottom: 12}}
          />
        )}
      />
    </ScreenContainer>
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
});
