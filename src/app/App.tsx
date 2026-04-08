import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useStore} from '@/store';
import {RootNavigator} from '@/navigation/RootNavigator';

export default function App() {
  const isDarkMode = useStore(state => state.isDarkMode);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
