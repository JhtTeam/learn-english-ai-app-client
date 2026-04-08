import React, {useCallback} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks/useTheme';
import {ScreenContainer} from '@/components/layout/ScreenContainer';
import {LessonCard} from '@/components/cards/LessonCard';
import type {HomeStackParamList} from '@/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const LESSONS = [
  {id: '1', title: 'Numbers 1-10', description: 'Count from one to ten', icon: '🔢', progress: 100},
  {id: '2', title: 'ABC Song', description: 'Learn the alphabet', icon: '🔤', progress: 75},
  {
    id: '3',
    title: 'My Body',
    description: 'Head, shoulders, knees and toes',
    icon: '🧒',
    progress: 40,
  },
  {id: '4', title: 'Weather', description: 'Sunny, rainy, cloudy', icon: '⛅', progress: 0},
  {id: '5', title: 'Fruits', description: 'Apple, banana, orange', icon: '🍎', progress: 0},
  {id: '6', title: 'Transportation', description: 'Cars, trains, planes', icon: '🚗', progress: 0},
  {id: '7', title: 'Emotions', description: 'Happy, sad, excited', icon: '😊', progress: 0},
  {id: '8', title: 'School', description: 'Classroom vocabulary', icon: '🏫', progress: 0},
];

export function LessonsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleLessonPress = useCallback(
    (title: string) => {
      navigation.navigate('Conversation', {topic: title});
    },
    [navigation],
  );

  return (
    <ScreenContainer>
      <FlatList
        data={LESSONS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[theme.typography.h2, {color: theme.colors.text}]}>Lessons</Text>
            <Text
              style={[theme.typography.body, {color: theme.colors.textSecondary, marginTop: 4}]}>
              Choose a topic to practice
            </Text>
          </View>
        }
        renderItem={({item}) => (
          <LessonCard
            title={item.title}
            description={item.description}
            icon={item.icon}
            progress={item.progress}
            onPress={() => handleLessonPress(item.title)}
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
    paddingBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
