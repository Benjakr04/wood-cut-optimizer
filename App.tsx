import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { colors } from './src/theme/theme';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <HomeScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});