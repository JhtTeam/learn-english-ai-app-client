import React, {memo, type PropsWithChildren} from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/hooks/useTheme';

interface Props {
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const ScreenContainer = memo<PropsWithChildren<Props>>(
  ({children, style, edges = ['top']}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const paddingStyle: ViewStyle = {
      paddingTop: edges.includes('top') ? insets.top : 0,
      paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
      paddingLeft: edges.includes('left') ? insets.left : 0,
      paddingRight: edges.includes('right') ? insets.right : 0,
    };

    return (
      <View
        style={[styles.container, {backgroundColor: theme.colors.background}, paddingStyle, style]}>
        {children}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
