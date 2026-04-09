import React, {useCallback} from 'react';
import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {useTheme} from '@/hooks/useTheme';
import {useStore} from '@/store';
import {ScreenContainer} from '@/components/layout/ScreenContainer';
import type {InteractionMode} from '@/types';

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

function SettingsRow({title, subtitle, right, onPress}: SettingsRowProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.row, {borderBottomColor: theme.colors.border}]}>
      <View style={styles.rowContent}>
        <Text style={[theme.typography.body, {color: theme.colors.text}]}>{title}</Text>
        {subtitle && (
          <Text style={[theme.typography.caption, {color: theme.colors.textSecondary}]}>
            {subtitle}
          </Text>
        )}
      </View>
      {right && <View>{right}</View>}
    </Pressable>
  );
}

export function SettingsScreen() {
  const theme = useTheme();
  const isDarkMode = useStore(state => state.isDarkMode);
  const toggleDarkMode = useStore(state => state.toggleDarkMode);
  const logout = useStore(state => state.logout);
  const user = useStore(state => state.user);
  const preferredInteractionMode = useStore(state => state.preferredInteractionMode);
  const setPreferredInteractionMode = useStore(state => state.setPreferredInteractionMode);

  const isAutoVAD = preferredInteractionMode === 'auto_vad';

  const handleToggleTalkMode = useCallback(() => {
    const newMode: InteractionMode = isAutoVAD ? 'push_to_talk' : 'auto_vad';
    setPreferredInteractionMode(newMode);
  }, [isAutoVAD, setPreferredInteractionMode]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Profile Section */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
            },
          ]}>
          <Text style={styles.avatar}>{'🌟'}</Text>
          <Text style={[theme.typography.h3, {color: theme.colors.text}]}>
            {user?.name ?? 'Student'}
          </Text>
          <Text style={[theme.typography.caption, {color: theme.colors.textSecondary}]}>
            Level {user?.level ?? 1} • {user?.xp ?? 0} XP
          </Text>
        </View>

        {/* Settings List */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
            },
          ]}>
          <SettingsRow
            title="Dark Mode"
            subtitle="Easier on the eyes"
            right={
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primaryLight,
                }}
                thumbColor={isDarkMode ? theme.colors.primary : '#f4f4f4'}
              />
            }
          />
          <SettingsRow
            title="Talk Mode"
            subtitle={
              isAutoVAD ? 'Auto (AI detects when child stops)' : 'Push to talk (Hold button)'
            }
            right={
              <Switch
                value={isAutoVAD}
                onValueChange={handleToggleTalkMode}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primaryLight,
                }}
                thumbColor={isAutoVAD ? theme.colors.primary : '#f4f4f4'}
              />
            }
          />
          <SettingsRow title="Language" subtitle="Vietnamese" />
          <SettingsRow title="Sound Effects" subtitle="On" />
          <SettingsRow title="About" subtitle="Version 1.0.0" />
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
            },
          ]}>
          <SettingsRow
            title="Log Out"
            onPress={handleLogout}
            right={<Text style={{color: theme.colors.error}}>{'→'}</Text>}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  avatar: {
    fontSize: 48,
    marginBottom: 8,
  },
  section: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowContent: {
    flex: 1,
  },
});
