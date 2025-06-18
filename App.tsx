import React, { useState } from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import ScanScreen from './app/scan/scan-screen'
import TestSensorsScreen from './app/test-sensors'
import { colors } from './theme/colors'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'scan' | 'test'>('scan')

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.navigation}>
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'scan' && styles.activeNavButton]}
          onPress={() => setCurrentScreen('scan')}
        >
          <Text style={[styles.navText, currentScreen === 'scan' && styles.activeNavText]}>
            📹 Scan Truck
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'test' && styles.activeNavButton]}
          onPress={() => setCurrentScreen('test')}
        >
          <Text style={[styles.navText, currentScreen === 'test' && styles.activeNavText]}>
            🧪 Test Sensors
          </Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      {currentScreen === 'scan' ? <ScanScreen /> : <TestSensorsScreen />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  navigation: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeNavButton: {
    backgroundColor: colors.orange,
  },
  navText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeNavText: {
    color: colors.white,
  },
})
