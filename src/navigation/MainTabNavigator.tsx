import React from 'react';
import {Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTheme} from '@/hooks/useTheme';
import {HomeScreen} from '@/features/home/screens/HomeScreen';
import {ConversationScreen} from '@/features/conversation/screens/ConversationScreen';
import {LessonsScreen} from '@/features/lessons/screens/LessonsScreen';
import {SettingsScreen} from '@/features/settings/screens/SettingsScreen';
import type {HomeStackParamList, MainTabParamList} from '@/types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  const theme = useTheme();

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.surface},
        headerTintColor: theme.colors.text,
        headerTitleStyle: theme.typography.h3,
      }}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{headerShown: false}} />
      <HomeStack.Screen
        name="Conversation"
        component={ConversationScreen}
        options={({route}) => ({
          title: route.params?.topic ?? 'Conversation',
          headerBackTitle: 'Back',
        })}
      />
    </HomeStack.Navigator>
  );
}

function TabIcon({icon, focused}: {icon: string; focused: boolean}) {
  return <Text style={{fontSize: 24, opacity: focused ? 1 : 0.5}}>{icon}</Text>;
}

export function MainTabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.inactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({focused}) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="LessonsTab"
        component={LessonsScreen}
        options={{
          tabBarLabel: 'Lessons',
          tabBarIcon: ({focused}) => <TabIcon icon="📚" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({focused}) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
