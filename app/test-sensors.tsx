import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SensorMonitor } from '../components/sensor-monitor'
import { SensorTest } from '../components/sensor-test'
import { colors } from '../theme/colors'

export default function TestSensorsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sensor Testing</Text>
        <Text style={styles.subtitle}>Test angle detection and yaw tracking</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Real-time Sensor Monitor</Text>
        <Text style={styles.description}>
          This shows live sensor data including pitch, roll, yaw progress, and quality scoring.
          Use the "Start Test" button to begin monitoring without recording.
        </Text>
        <SensorMonitor 
          isRecording={false}
          testMode={true}
          onQualityWarning={(warning) => console.log('⚠️ Warning:', warning)}
          onQualityGood={() => console.log('✅ Quality good')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔬 Raw Sensor Data</Text>
        <Text style={styles.description}>
          This shows raw sensor values from gyroscope, accelerometer, and device motion sensors.
          Press "Start Monitoring" to see live data.
        </Text>
        <SensorTest />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 How to Test</Text>
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>1. Angle Detection Test:</Text>
          <Text style={styles.instructionText}>• Hold device level (pitch/roll should be close to 0°)</Text>
          <Text style={styles.instructionText}>• Tilt device forward/backward to see pitch changes</Text>
          <Text style={styles.instructionText}>• Tilt device left/right to see roll changes</Text>
          <Text style={styles.instructionText}>• Watch quality score decrease when device is tilted</Text>
          
          <Text style={styles.instructionTitle}>2. Yaw Detection Test:</Text>
          <Text style={styles.instructionText}>• Start test mode and note the starting position</Text>
          <Text style={styles.instructionText}>• Rotate device around vertical axis (like circling a truck)</Text>
          <Text style={styles.instructionText}>• Watch yaw progress increase as you rotate</Text>
          <Text style={styles.instructionText}>• Complete a full circle (360°) to reach 100% progress</Text>
          
          <Text style={styles.instructionTitle}>3. Quality Monitoring:</Text>
          <Text style={styles.instructionText}>• Keep device level for best quality score</Text>
          <Text style={styles.instructionText}>• Complete full circles for optimal scanning</Text>
          <Text style={styles.instructionText}>• Watch for quality warnings when thresholds are exceeded</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Expected Results</Text>
        <View style={styles.expectedResults}>
          <Text style={styles.resultTitle}>Good Quality (80-100%):</Text>
          <Text style={styles.resultText}>• Device level (pitch/roll {'<'} 15°)</Text>
          <Text style={styles.resultText}>• Yaw progress {'>'} 80%</Text>
          <Text style={styles.resultText}>• No quality warnings</Text>
          
          <Text style={styles.resultTitle}>Poor Quality (0-50%):</Text>
          <Text style={styles.resultText}>• Device tilted (pitch/roll {'>'} 15°)</Text>
          <Text style={styles.resultText}>• Incomplete circling (yaw {'<'} 80%)</Text>
          <Text style={styles.resultText}>• Quality warnings displayed</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.orange,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    margin: 20,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.orange,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  instructions: {
    gap: 8,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  expectedResults: {
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
}) 