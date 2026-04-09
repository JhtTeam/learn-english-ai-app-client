import React, {useCallback} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks/useTheme';
import {ScreenContainer} from '@/components/layout/ScreenContainer';
import type {HomeStackParamList} from '@/types';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const LESSON_COLORS = [
  '#E3F2FD', // light blue
  '#FFF3E0', // light orange
  '#FCE4EC', // light pink
  '#E8F5E9', // light green
  '#F3E5F5', // light purple
  '#FFF9C4', // light yellow
  '#E0F7FA', // light cyan
  '#FFEBEE', // light red
];

const LESSONS = [
  {id: '1', title: 'Numbers', icon: '\u{1F522}', progress: 100},
  {id: '2', title: 'ABC', icon: '\u{1F524}', progress: 75},
  {id: '3', title: 'My Body', icon: '\u{1F9D2}', progress: 40},
  {id: '4', title: 'Weather', icon: '\u26C5', progress: 0},
  {id: '5', title: 'Fruits', icon: '\u{1F34E}', progress: 0},
  {id: '6', title: 'Transport', icon: '\u{1F697}', progress: 0},
  {id: '7', title: 'Emotions', icon: '\u{1F60A}', progress: 0},
  {id: '8', title: 'School', icon: '\u{1F3EB}', progress: 0},
];

export function LessonsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const handleLessonPress = useCallback(
    (title: string, emoji: string) => {
      navigation.navigate('Conversation', {topic: title, topicEmoji: emoji});
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
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[theme.typography.h2, {color: theme.colors.text}]}>
              Lessons {'\u{1F4DA}'}
            </Text>
          </View>
        }
        renderItem={({item, index}) => (
          <Pressable
            onPress={() => handleLessonPress(item.title, item.icon)}
            style={({pressed}) => [
              styles.lessonCard,
              {
                backgroundColor: LESSON_COLORS[index % LESSON_COLORS.length],
                borderRadius: theme.borderRadius.lg,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Text style={styles.lessonIcon}>{item.icon}</Text>
            <Text
              style={[theme.typography.caption, styles.lessonTitle, {color: theme.colors.text}]}
              numberOfLines={1}>
              {item.title}
            </Text>
            {item.progress > 0 && (
              <View style={[styles.progressBar, {backgroundColor: theme.colors.border}]}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${item.progress}%`, backgroundColor: theme.colors.primary},
                  ]}
                />
              </View>
            )}
          </Pressable>
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
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  lessonCard: {
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
  lessonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  lessonTitle: {
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
