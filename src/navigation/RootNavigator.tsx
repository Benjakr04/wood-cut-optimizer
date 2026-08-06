//RootNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { CutsScreen } from '../screens/CutsScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { colors } from '../theme/theme';

export type RootTabParamList = {
  Inicio: undefined;
  Cortes: undefined;
  Inventario: undefined;
  Resultados: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Inicio: 'home-outline',
  Cortes: 'cut-outline',
  Inventario: 'layers-outline',
  Resultados: 'stats-chart-outline',
};

export const RootNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: Math.max(8, insets.bottom + 4), // respeta safe area + margen
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name as keyof RootTabParamList]} size={size ?? 20} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Cortes" component={CutsScreen} />
      <Tab.Screen name="Inventario" component={InventoryScreen} />
      <Tab.Screen name="Resultados" component={ResultsScreen} />
    </Tab.Navigator>
  );
};