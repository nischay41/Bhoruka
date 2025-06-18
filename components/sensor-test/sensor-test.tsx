import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Gyroscope, Accelerometer, DeviceMotion } from 'expo-sensors'
import { colors } from '../../theme/colors'

interface SensorTestData {
  gyroscope: { x: number; y: number; z: number } | null
  accelerometer: { x: number; y: number; z: number } | null
  deviceMotion: { alpha: number; beta: number; gamma: number } | null
}

export function SensorTest() {
  const [sensorData, setSensorData] = useState<SensorTestData>({
    gyroscope: null,
    accelerometer: null,
    deviceMotion: null,
  })
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    async function checkPermissions() {
      try {
        const motionPermission = await DeviceMotion.requestPermissionsAsync()
        setHasPermission(motionPermission.granted)
      } catch (error) {
        console.error('Error checking permissions:', error)
      }
    }
    checkPermissions()
  }, [])

  function startMonitoring() {
    if (!hasPermission) return

    setIsMonitoring(true)
    
    // Set update intervals
    Gyroscope.setUpdateInterval(500)
    Accelerometer.setUpdateInterval(500)
    DeviceMotion.setUpdateInterval(500)

    // Subscribe to sensors
    const gyroSubscription = Gyroscope.addListener((data) => {
      setSensorData(prev => ({ ...prev, gyroscope: data }))
    })

    const accelSubscription = Accelerometer.addListener((data) => {
      setSensorData(prev => ({ ...prev, accelerometer: data }))
    })

    const motionSubscription = DeviceMotion.addListener((data) => {
      if (data.rotation) {
        setSensorData(prev => ({ ...prev, deviceMotion: data.rotation }))
      }
    })

    // Cleanup function
    return () => {
      gyroSubscription.remove()
      accelSubscription.remove()
      motionSubscription.remove()
    }
  }

  function stopMonitoring() {
    setIsMonitoring(false)
    setSensorData({
      gyroscope: null,
      accelerometer: null,
      deviceMotion: null,
    })
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Sensor permissions required</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensor Test</Text>
      
      <TouchableOpacity 
        style={[styles.button, isMonitoring ? styles.stopButton : styles.startButton]}
        onPress={isMonitoring ? stopMonitoring : startMonitoring}
      >
        <Text style={styles.buttonText}>
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </Text>
      </TouchableOpacity>

      {sensorData.gyroscope && (
        <View style={styles.sensorSection}>
          <Text style={styles.sensorTitle}>Gyroscope</Text>
          <Text style={styles.sensorData}>
            X: {sensorData.gyroscope.x.toFixed(3)} | 
            Y: {sensorData.gyroscope.y.toFixed(3)} | 
            Z: {sensorData.gyroscope.z.toFixed(3)}
          </Text>
        </View>
      )}

      {sensorData.accelerometer && (
        <View style={styles.sensorSection}>
          <Text style={styles.sensorTitle}>Accelerometer</Text>
          <Text style={styles.sensorData}>
            X: {sensorData.accelerometer.x.toFixed(3)} | 
            Y: {sensorData.accelerometer.y.toFixed(3)} | 
            Z: {sensorData.accelerometer.z.toFixed(3)}
          </Text>
        </View>
      )}

      {sensorData.deviceMotion && (
        <View style={styles.sensorSection}>
          <Text style={styles.sensorTitle}>Device Motion</Text>
          <Text style={styles.sensorData}>
            Alpha: {sensorData.deviceMotion.alpha.toFixed(1)}° | 
            Beta: {sensorData.deviceMotion.beta.toFixed(1)}° | 
            Gamma: {sensorData.deviceMotion.gamma.toFixed(1)}°
          </Text>
        </View>
      )}

      {!isMonitoring && (
        <Text style={styles.instructionText}>
          Press "Start Monitoring" to test sensor functionality
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    margin: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.orange,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: colors.orange,
  },
  stopButton: {
    backgroundColor: 'red',
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sensorSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.orange,
    marginBottom: 5,
  },
  sensorData: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  instructionText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontWeight: 'bold',
  },
}) 