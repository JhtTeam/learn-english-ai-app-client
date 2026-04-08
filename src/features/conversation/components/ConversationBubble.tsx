import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '@/hooks/useTheme';
import type {ConversationMessage} from '@/types';

interface Props {
  message: ConversationMessage;
}

export const ConversationBubble = memo<Props>(({message}) => {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? theme.colors.primary : theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            borderBottomRightRadius: isUser ? 4 : theme.borderRadius.lg,
            borderBottomLeftRadius: isUser ? theme.borderRadius.lg : 4,
          },
        ]}>
        <Text
          style={[
            theme.typography.body,
            {
              color: isUser ? theme.colors.textInverse : theme.colors.text,
            },
          ]}>
          {message.content}
        </Text>
      </View>
      <Text
        style={[
          theme.typography.caption,
          styles.timestamp,
          {color: theme.colors.textSecondary},
          isUser && styles.timestampUser,
        ]}>
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  bubble: {
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  timestamp: {
    marginTop: 4,
    fontSize: 11,
  },
  timestampUser: {
    textAlign: 'right',
  },
});
