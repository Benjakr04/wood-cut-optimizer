//src/navigation/RootNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { CutsScreen } from '../screens/CutsScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { TopTabBar } from '../components/TopTabBar';

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

export const RootNavigator: React.FC = () => (
  <Tab.Navigator
    initialRouteName="Inicio"
    // Barra propia, arriba: abajo la tapaba la barra del sistema en Android.
    tabBar={(props) => <TopTabBar {...props} />}
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => (
        <Ionicons
          name={ICONS[route.name as keyof RootTabParamList]}
          size={size ?? 20}
          color={color}
        />
      ),
    })}
  >
    <Tab.Screen name="Inicio" component={HomeScreen} />
    <Tab.Screen name="Cortes" component={CutsScreen} />
    <Tab.Screen name="Inventario" component={InventoryScreen} />
    <Tab.Screen name="Resultados" component={ResultsScreen} />
  </Tab.Navigator>
);