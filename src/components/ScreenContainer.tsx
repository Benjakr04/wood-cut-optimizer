//src/components/ScreenContainer.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from './TopTabBar';
import { colors } from '../theme/theme';

/**
 * Reemplaza al SafeAreaView de cada pantalla. Deja lugar arriba para la barra
 * de pestañas (que ahora está arriba y flota en absoluto) y abajo para la
 * barra de gestos / botones del sistema.
 */
export const ScreenContainer: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.base,
        { paddingTop: insets.top + TAB_BAR_HEIGHT, paddingBottom: insets.bottom },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: { flex: 1, backgroundColor: colors.background },
});