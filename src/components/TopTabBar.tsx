//src/components/TopTabBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacing, radius } from '../theme/theme';
import { CommonActions } from '@react-navigation/native';

/** Alto de la barra SIN el safe area de arriba. */
export const TAB_BAR_HEIGHT = 56;

/**
 * Barra de pestañas arriba de la pantalla. Va posicionada en absoluto para
 * que funcione igual en cualquier versión de React Navigation: el navigator
 * la dibuja donde quiera, pero ella se ancla sola al borde de arriba.
 *
 * Motivo del cambio: abajo, la barra de navegación del sistema (Android) y la
 * barra del navegador tapaban las pestañas y no se podía tocar "Resultados".
 */
export const TopTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;
          const color = isFocused ? colors.primary : colors.textMuted;

        const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              // Despachamos la acción en vez de navigation.navigate(name, params):
              // así no hay que pelear con los tipos del navigator y `merge: true`
              // conserva los params de la pestaña.
              navigation.dispatch({
                ...CommonActions.navigate({ name: route.name, merge: true }),
                target: state.key,
              });
            }
          };

          const onLongPress = () =>
            navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.75}
            >
              {options.tabBarIcon?.({ focused: isFocused, color, size: 20 })}
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {label}
              </Text>
              <View style={[styles.indicator, isFocused && styles.indicatorActive]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  indicator: {
    height: 3,
    width: '55%',
    borderRadius: radius.full,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
});