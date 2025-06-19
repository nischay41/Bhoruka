import React from 'react';
import { View, StyleSheet } from 'react-native';
import ScanScreen from './app/scan/scan-screen';
import { colors } from './theme/colors';

export default function App() {
  return (
    <View style={styles.container}>
      <ScanScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
});
