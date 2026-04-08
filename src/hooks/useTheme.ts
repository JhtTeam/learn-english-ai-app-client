import {useMemo} from 'react';
import {useStore} from '@/store';
import {darkTheme, lightTheme, type Theme} from '@/config/theme';

export function useTheme(): Theme {
  const isDarkMode = useStore(state => state.isDarkMode);
  return useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);
}

export function useColors() {
  const theme = useTheme();
  return theme.colors;
}

export function useSpacing() {
  const theme = useTheme();
  return theme.spacing;
}
