import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { useThemeColor } from '../../theme/useThemeColor';
import { useTheme } from '@/context/ThemeContext';

export function MainContainer({ children, style, ...props }: ViewProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={ [styles.outerContainer, { backgroundColor }] }>
      <View style={ [styles.innerContainer, style] } {...props}>{ children }</View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center'
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    //Limit width to 1200px on Web, stay 100% on Mobile
    ...Platform.select({web: {maxWidth: 1200, alignSelf: 'center'}})
  }
});
