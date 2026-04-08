import React, {memo} from 'react';
import {Pressable, StyleSheet, Text, View, type ViewStyle} from 'react-native';
import {useTheme} from '@/hooks/useTheme';

interface Props {
  title: string;
  description: string;
  icon: string;
  progress?: number; // 0-100
  onPress: () => void;
  style?: ViewStyle;
}

export const LessonCard = memo<Props>(({title, description, icon, progress, onPress, style}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.lg,
          opacity: pressed ? 0.9 : 1,
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[theme.typography.h3, {color: theme.colors.text}]}>{title}</Text>
        <Text style={[theme.typography.caption, {color: theme.colors.textSecondary, marginTop: 4}]}>
          {description}
        </Text>
        {progress !== undefined && (
          <View style={[styles.progressBar, {backgroundColor: theme.colors.border}]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    elevation: 2,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
