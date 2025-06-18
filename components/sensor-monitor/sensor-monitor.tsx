import React, { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { Gyroscope, Accelerometer, DeviceMotion } from 'expo-sensors'
import { colors } from '../../theme/colors'

interface SensorData {
  pitch: number
  roll: number
  yaw: number
  isLevel: boolean
  isUpright: boolean
  yawProgress: number
}

interface SensorMonitorProps {
  isRecording: boolean
  onQualityWarning?: (warning: string) => void
  onQualityGood?: () => void
  testMode?: boolean // Add test mode prop
}

interface QualityThresholds {
  maxPitchTilt: number // degrees
  maxRollTilt: number // degrees
  minYawProgress: number // percentage of full circle
  maxYawProgress: number // percentage of full circle
  gracePeriodSeconds: number // time before warnings start
  warningCooldownSeconds: number // time between warnings
  yawSensitivity: number // sensitivity for yaw detection
  yawCalibrationTime: number // time to calibrate yaw sensor
}

const QUALITY_THRESHOLDS: QualityThresholds = {
  maxPitchTilt: 25, // Allow 25° of pitch tilt (more realistic for walking)
  maxRollTilt: 25, // Allow 25° of roll tilt (more realistic for walking)
  minYawProgress: 60, // At least 60% of full circle (more realistic)
  maxYawProgress: 140, // No more than 140% of full circle
  gracePeriodSeconds: 5, // 5 seconds grace period before warnings
  warningCooldownSeconds: 3, // 3 seconds between warnings
  yawSensitivity: 0.1, // Reduced sensitivity for easier detection (radians/second)
  yawCalibrationTime: 2, // 2 seconds to calibrate yaw sensor
}

export function SensorMonitor({ isRecording, onQualityWarning, onQualityGood, testMode = false }: SensorMonitorProps) {
  const [sensorData, setSensorData] = useState<SensorData>({
    pitch: 0,
    roll: 0,
    yaw: 0,
    isLevel: true,
    isUpright: true,
    yawProgress: 0,
  })

  const [hasPermission, setHasPermission] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [isTestModeActive, setIsTestModeActive] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<string>('Checking...')
  const [retryCount, setRetryCount] = useState(0)
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null)
  const [lastWarningTime, setLastWarningTime] = useState<number | null>(null)
  const [yawCalibrationStart, setYawCalibrationStart] = useState<number | null>(null)
  const [isYawCalibrated, setIsYawCalibrated] = useState(false)
  
  const startYawRef = useRef<number | null>(null)
  const yawHistoryRef = useRef<number[]>([])
  const lastWarningRef = useRef<string | null>(null)
  const qualityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const yawIntegrationRef = useRef<number>(0) // Integrated yaw rotation
  const lastGyroTimeRef = useRef<number | null>(null)
  const yawCalibrationDataRef = useRef<number[]>([])

  // Request permissions and check availability
  useEffect(() => {
    setupSensors()
  }, [retryCount])

  async function setupSensors() {
    try {
      setPermissionStatus('Requesting permissions...')
      console.log('🔄 Starting sensor setup...')
      
      // Request permissions for sensors that require it
      console.log('📋 Requesting Gyroscope permission...')
      const gyroPermission = await Gyroscope.requestPermissionsAsync()
      console.log('📋 Requesting Accelerometer permission...')
      const accelPermission = await Accelerometer.requestPermissionsAsync()

      // DeviceMotion might not require explicit permission on all platforms
      let motionPermission = { granted: true }
      try {
        console.log('📋 Requesting DeviceMotion permission...')
        motionPermission = await DeviceMotion.requestPermissionsAsync()
      } catch (error) {
        console.log('⚠️ DeviceMotion permission not required on this platform:', error)
      }

      console.log('🔐 Permission results:', {
        motion: motionPermission.granted,
        gyro: gyroPermission.granted,
        accel: accelPermission.granted,
      })

      // Check if we have at least gyroscope and accelerometer permissions
      const hasBasicPermissions = gyroPermission.granted && accelPermission.granted
      
      if (hasBasicPermissions) {
        setHasPermission(true)
        setPermissionStatus('Permissions granted')
        console.log('✅ Basic permissions granted, checking sensor availability...')
        
        // Check if sensors are available
        console.log('🔍 Checking Gyroscope availability...')
        const gyroAvailable = await Gyroscope.isAvailableAsync()
        console.log('🔍 Checking Accelerometer availability...')
        const accelAvailable = await Accelerometer.isAvailableAsync()
        
        let motionAvailable = false
        try {
          console.log('🔍 Checking DeviceMotion availability...')
          motionAvailable = await DeviceMotion.isAvailableAsync()
        } catch (error) {
          console.log('⚠️ DeviceMotion availability check failed:', error)
        }
        
        console.log('📱 Sensor availability:', {
          gyro: gyroAvailable,
          accel: accelAvailable,
          motion: motionAvailable,
        })
        
        // We can work with just gyroscope and accelerometer
        const hasMinimumSensors = gyroAvailable && accelAvailable
        setIsAvailable(hasMinimumSensors)
        
        if (!hasMinimumSensors) {
          setPermissionStatus('Core sensors not available')
          console.warn('❌ Core sensors (gyroscope/accelerometer) not available on this device')
        } else if (!motionAvailable) {
          setPermissionStatus('Basic sensors ready (DeviceMotion unavailable)')
          console.log('✅ Basic sensors ready, DeviceMotion not available')
        } else {
          setPermissionStatus('All sensors ready')
          console.log('✅ All sensors ready')
        }
      } else {
        setHasPermission(false)
        setPermissionStatus('Core permissions denied')
        console.error('❌ Core permissions denied:', {
          gyro: gyroPermission.granted,
          accel: accelPermission.granted,
        })
        Alert.alert(
          'Sensor Permission Required',
          'This app needs access to device motion sensors to ensure quality scanning. Please grant permission in Settings.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('❌ Error setting up sensors:', error)
      setPermissionStatus('Error setting up sensors')
    }
  }

  // Retry permissions function
  function retryPermissions() {
    setRetryCount(prev => prev + 1)
    setPermissionStatus('Retrying permissions...')
  }

  // Start/stop sensor monitoring based on recording state or test mode
  useEffect(() => {
    if (!hasPermission || !isAvailable) return

    const shouldMonitor = isRecording || (testMode && isTestModeActive)
    if (!shouldMonitor) return

    let gyroSubscription: any
    let accelSubscription: any
    let motionSubscription: any

    console.log('🎯 Starting sensor monitoring...', { isRecording, testMode, isTestModeActive })
    
    // Set recording start time for grace period
    if (isRecording) {
      setRecordingStartTime(Date.now())
      console.log('⏱️ Recording started, grace period begins...')
    }
    
    // Start yaw calibration
    setYawCalibrationStart(Date.now())
    setIsYawCalibrated(false)
    yawCalibrationDataRef.current = []
    yawIntegrationRef.current = 0
    lastGyroTimeRef.current = null
    
    // Reset yaw tracking
    startYawRef.current = null
    yawHistoryRef.current = []
    lastWarningRef.current = null
    setLastWarningTime(null)

    // Set update intervals for real-time monitoring
    Gyroscope.setUpdateInterval(100) // 10Hz for smooth tracking
    Accelerometer.setUpdateInterval(100)
    
    // Only set DeviceMotion interval if it's available
    try {
      DeviceMotion.setUpdateInterval(100)
    } catch (error) {
      console.log('DeviceMotion not available, skipping...')
    }

    // Subscribe to gyroscope for yaw tracking
    gyroSubscription = Gyroscope.addListener((gyroData) => {
      const currentTime = Date.now()
      
      // Yaw calibration phase - only run once
      if (yawCalibrationStart && !isYawCalibrated) {
        const calibrationElapsed = (currentTime - yawCalibrationStart) / 1000
        
        if (calibrationElapsed < QUALITY_THRESHOLDS.yawCalibrationTime) {
          // Collect calibration data
          yawCalibrationDataRef.current.push(gyroData.z)
          console.log(`🔧 Calibrating yaw sensor... ${calibrationElapsed.toFixed(1)}s`)
          return
        } else {
          // Calibration complete - set state and exit
          setIsYawCalibrated(true)
          const avgCalibration = yawCalibrationDataRef.current.reduce((a, b) => a + b, 0) / yawCalibrationDataRef.current.length
          console.log(`✅ Yaw calibration complete. Baseline: ${avgCalibration.toFixed(4)}`)
          
          // Set baseline for integration
          yawIntegrationRef.current = 0
          lastGyroTimeRef.current = currentTime
          return
        }
      }
      
      // Only track yaw after calibration is complete
      if (!isYawCalibrated || !yawCalibrationStart) {
        console.log(`🚫 Yaw tracking blocked: calibrated=${isYawCalibrated}, startTime=${!!yawCalibrationStart}`)
        return
      }
      
      console.log(`🎯 Yaw tracking active, integrating rotation...`)
      
      // Integrate yaw rotation over time
      if (lastGyroTimeRef.current !== null) {
        const deltaTime = (currentTime - lastGyroTimeRef.current) / 1000 // Convert to seconds
        const yawRate = gyroData.z // radians per second
        
        console.log(`📊 Raw yaw rate: ${yawRate.toFixed(4)} rad/s, threshold: ${QUALITY_THRESHOLDS.yawSensitivity}`)
        
        // Only integrate if rotation rate is above sensitivity threshold
        if (Math.abs(yawRate) > QUALITY_THRESHOLDS.yawSensitivity) {
          yawIntegrationRef.current += yawRate * deltaTime
          console.log(`🔄 Yaw integration: ${yawRate.toFixed(3)} rad/s × ${deltaTime.toFixed(3)}s = ${(yawRate * deltaTime).toFixed(3)} rad`)
        } else {
          console.log(`⏸️ Yaw rate below threshold, skipping integration`)
        }
      } else {
        console.log(`⏱️ First yaw reading, setting baseline time`)
      }
      
      lastGyroTimeRef.current = currentTime
      
      // Calculate yaw progress (how much the user has rotated)
      const yawRadians = Math.abs(yawIntegrationRef.current)
      const yawDegrees = yawRadians * (180 / Math.PI)
      const yawProgress = Math.min((yawDegrees / 360) * 100, 100) // Convert to percentage, cap at 100%
      
      console.log(`📊 Yaw: ${yawRadians.toFixed(3)} rad (${yawDegrees.toFixed(1)}°) = ${yawProgress.toFixed(1)}% progress`)

      setSensorData(prev => ({
        ...prev,
        yaw: yawIntegrationRef.current,
        yawProgress: yawProgress,
      }))
    })

    // Subscribe to accelerometer for pitch/roll detection
    accelSubscription = Accelerometer.addListener((accelData) => {
      // Convert acceleration to angles
      const pitch = Math.atan2(-accelData.x, Math.sqrt(accelData.y * accelData.y + accelData.z * accelData.z)) * (180 / Math.PI)
      const roll = Math.atan2(accelData.y, accelData.z) * (180 / Math.PI)

      const isLevel = Math.abs(pitch) < QUALITY_THRESHOLDS.maxPitchTilt && Math.abs(roll) < QUALITY_THRESHOLDS.maxRollTilt
      const isUpright = Math.abs(pitch) < 45 && Math.abs(roll) < 45 // More lenient for upright detection

      setSensorData(prev => ({
        ...prev,
        pitch,
        roll,
        isLevel,
        isUpright,
      }))
    })

    // Subscribe to device motion for more accurate orientation data (if available)
    try {
      motionSubscription = DeviceMotion.addListener((motionData) => {
        if (motionData.rotation) {
          const { alpha, beta, gamma } = motionData.rotation
          
          // Use device motion data for more accurate angle calculations
          const pitch = beta || 0
          const roll = gamma || 0
          
          const isLevel = Math.abs(pitch) < QUALITY_THRESHOLDS.maxPitchTilt && Math.abs(roll) < QUALITY_THRESHOLDS.maxRollTilt
          const isUpright = Math.abs(pitch) < 45 && Math.abs(roll) < 45

          setSensorData(prev => ({
            ...prev,
            pitch,
            roll,
            isLevel,
            isUpright,
          }))
        }
      })
    } catch (error) {
      console.log('DeviceMotion listener not available, using accelerometer only')
    }

    // Start quality monitoring interval
    qualityCheckIntervalRef.current = setInterval(() => {
      checkQualityAndWarn()
    }, 1000) // Check every second

    return () => {
      // Stop all sensor subscriptions
      if (gyroSubscription) gyroSubscription.remove()
      if (accelSubscription) accelSubscription.remove()
      if (motionSubscription) motionSubscription.remove()
      
      if (qualityCheckIntervalRef.current) {
        clearInterval(qualityCheckIntervalRef.current)
        qualityCheckIntervalRef.current = null
      }

      // Reset timing states
      setRecordingStartTime(null)
      setLastWarningTime(null)
      setYawCalibrationStart(null)
      setIsYawCalibrated(false)
      
      // Reset yaw tracking
      yawIntegrationRef.current = 0
      lastGyroTimeRef.current = null
      yawCalibrationDataRef.current = []

      console.log('🛑 Stopped sensor monitoring')
    }
  }, [isRecording, testMode, isTestModeActive, hasPermission, isAvailable])

  // Quality checking and warning system
  function checkQualityAndWarn() {
    const currentTime = Date.now()
    
    // Check if we're still in grace period
    if (recordingStartTime && (currentTime - recordingStartTime) < (QUALITY_THRESHOLDS.gracePeriodSeconds * 1000)) {
      const remainingGrace = Math.ceil((QUALITY_THRESHOLDS.gracePeriodSeconds * 1000 - (currentTime - recordingStartTime)) / 1000)
      console.log(`⏱️ Grace period active, ${remainingGrace}s remaining...`)
      return
    }
    
    // Check if yaw is still calibrating
    if (yawCalibrationStart && !isYawCalibrated) {
      const calibrationElapsed = (currentTime - yawCalibrationStart) / 1000
      if (calibrationElapsed < QUALITY_THRESHOLDS.yawCalibrationTime) {
        const remainingCalibration = Math.ceil(QUALITY_THRESHOLDS.yawCalibrationTime - calibrationElapsed)
        console.log(`🔧 Yaw calibration in progress, ${remainingCalibration}s remaining...`)
        return
      } else {
        // Calibration should be complete by now, force it
        console.log(`⚠️ Calibration timeout, forcing completion...`)
        setIsYawCalibrated(true)
      }
    }
    
    // Check warning cooldown
    if (lastWarningTime && (currentTime - lastWarningTime) < (QUALITY_THRESHOLDS.warningCooldownSeconds * 1000)) {
      return
    }

    const warnings: string[] = []

    // Check device levelness (only warn if significantly tilted)
    if (!sensorData.isLevel) {
      warnings.push('Keep device more level for better scan quality')
    }

    // Check if device is too tilted (more lenient)
    if (!sensorData.isUpright) {
      warnings.push('Device is tilted - try to hold more upright')
    }

    // Check yaw progress (circling completion) - only warn after some time
    const recordingDuration = recordingStartTime ? (currentTime - recordingStartTime) / 1000 : 0
    if (recordingDuration > 10 && sensorData.yawProgress < QUALITY_THRESHOLDS.minYawProgress) {
      warnings.push(`Continue circling around truck - ${Math.round(sensorData.yawProgress)}% complete`)
    } else if (sensorData.yawProgress > QUALITY_THRESHOLDS.maxYawProgress) {
      warnings.push('Too much circling - stop recording')
    }

    // Determine overall quality status
    const hasQualityIssues = warnings.length > 0
    const currentWarning = warnings.join(' • ')

    // Only trigger callbacks if the warning has changed and we're not in grace period
    if (hasQualityIssues && currentWarning !== lastWarningRef.current) {
      onQualityWarning?.(currentWarning)
      lastWarningRef.current = currentWarning
      setLastWarningTime(currentTime)
      console.log('⚠️ Quality warning:', currentWarning)
    } else if (!hasQualityIssues && lastWarningRef.current !== null) {
      onQualityGood?.()
      lastWarningRef.current = null
      console.log('✅ Quality is good')
    }
  }

  // Get quality score (0-100)
  function getQualityScore(): number {
    let score = 100

    // Deduct points for tilt (more lenient)
    if (!sensorData.isLevel) {
      const tiltPenalty = Math.min(15, Math.abs(sensorData.pitch) + Math.abs(sensorData.roll) - QUALITY_THRESHOLDS.maxPitchTilt)
      score -= Math.max(0, tiltPenalty)
    }
    
    if (!sensorData.isUpright) {
      score -= 10 // Reduced penalty for upright
    }

    // Deduct points for incomplete circling (only after grace period)
    const recordingDuration = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0
    if (recordingDuration > 10 && sensorData.yawProgress < QUALITY_THRESHOLDS.minYawProgress) {
      const progressPenalty = Math.max(0, (QUALITY_THRESHOLDS.minYawProgress - sensorData.yawProgress) / QUALITY_THRESHOLDS.minYawProgress * 25)
      score -= progressPenalty
    }

    // Bonus for good performance
    if (sensorData.isLevel && sensorData.isUpright && sensorData.yawProgress > QUALITY_THRESHOLDS.minYawProgress) {
      score = Math.min(100, score + 5) // Small bonus for good performance
    }

    return Math.max(0, Math.round(score))
  }

  // Test mode toggle
  function toggleTestMode() {
    setIsTestModeActive(!isTestModeActive)
    if (!isTestModeActive) {
      // Reset yaw when starting test mode
      startYawRef.current = null
      yawHistoryRef.current = []
      setSensorData(prev => ({ ...prev, yawProgress: 0 }))
      setRecordingStartTime(Date.now()) // Start timing for test mode
      setLastWarningTime(null)
      setYawCalibrationStart(Date.now()) // Start yaw calibration
      setIsYawCalibrated(false)
      yawCalibrationDataRef.current = []
      yawIntegrationRef.current = 0
      lastGyroTimeRef.current = null
      console.log('🧪 Test mode started, grace period and calibration begin...')
    } else {
      // Reset timing when stopping test mode
      setRecordingStartTime(null)
      setLastWarningTime(null)
      setYawCalibrationStart(null)
      setIsYawCalibrated(false)
      yawIntegrationRef.current = 0
      lastGyroTimeRef.current = null
      yawCalibrationDataRef.current = []
      console.log('🧪 Test mode stopped')
    }
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>Sensor permissions required</Text>
        <Text style={styles.statusText}>{permissionStatus}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryPermissions}>
          <Text style={styles.retryButtonText}>Retry Permissions</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <Text style={styles.warningText}>Sensors not available on this device</Text>
        <Text style={styles.statusText}>{permissionStatus}</Text>
      </View>
    )
  }

  const qualityScore = getQualityScore()
  const isMonitoring = isRecording || (testMode && isTestModeActive)

  return (
    <View style={styles.container}>
      {/* Test mode controls */}
      {testMode && (
        <View style={styles.testControls}>
          <TouchableOpacity 
            style={[styles.testButton, isTestModeActive ? styles.testButtonActive : styles.testButtonInactive]}
            onPress={toggleTestMode}
          >
            <Text style={styles.testButtonText}>
              {isTestModeActive ? 'Stop Test' : 'Start Test'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.testStatus}>
            {isTestModeActive ? 'Test Mode Active' : 'Test Mode Ready'}
          </Text>
        </View>
      )}

      {/* Only show monitoring data when actually monitoring */}
      {isMonitoring && (
        <>
          <View style={styles.qualityIndicator}>
            <View style={[styles.qualityBar, { width: `${qualityScore}%` }]} />
            <Text style={styles.qualityText}>Quality: {Math.round(qualityScore)}%</Text>
          </View>
          
          {/* Grace period indicator */}
          {recordingStartTime && (Date.now() - recordingStartTime) < (QUALITY_THRESHOLDS.gracePeriodSeconds * 1000) && (
            <View style={styles.gracePeriodIndicator}>
              <Text style={styles.gracePeriodText}>
                ⏱️ Getting ready... {Math.ceil((QUALITY_THRESHOLDS.gracePeriodSeconds * 1000 - (Date.now() - recordingStartTime)) / 1000)}s
              </Text>
            </View>
          )}
          
          {/* Yaw calibration indicator */}
          {yawCalibrationStart && !isYawCalibrated && (
            <View style={styles.calibrationIndicator}>
              <Text style={styles.calibrationText}>
                🔧 Calibrating sensors... {Math.ceil(QUALITY_THRESHOLDS.yawCalibrationTime - ((Date.now() - yawCalibrationStart) / 1000))}s
              </Text>
            </View>
          )}
          
          {/* Calibration complete indicator */}
          {isYawCalibrated && (
            <View style={styles.calibrationCompleteIndicator}>
              <Text style={styles.calibrationCompleteText}>
                ✅ Sensors calibrated - Start circling around truck
              </Text>
            </View>
          )}
          
          <View style={styles.sensorData}>
            <Text style={styles.dataText}>
              Pitch: {sensorData.pitch.toFixed(1)}° | Roll: {sensorData.roll.toFixed(1)}°
            </Text>
            <Text style={styles.dataText}>
              Yaw Progress: {sensorData.yawProgress.toFixed(1)}%
            </Text>
            <Text style={styles.dataText}>
              Level: {sensorData.isLevel ? '✅' : '⚠️'} | Upright: {sensorData.isUpright ? '✅' : '⚠️'}
            </Text>
          </View>
        </>
      )}

      {/* Status when not monitoring */}
      {!isMonitoring && (
        <Text style={styles.statusText}>
          {testMode ? 'Press "Start Test" to begin sensor monitoring' : 'Start recording to monitor sensors'}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 12,
    zIndex: 1000,
  },
  testControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  testButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  testButtonActive: {
    backgroundColor: 'red',
  },
  testButtonInactive: {
    backgroundColor: colors.orange,
  },
  testButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  testStatus: {
    color: colors.white,
    fontSize: 12,
    fontStyle: 'italic',
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityBar: {
    height: 4,
    backgroundColor: colors.orange,
    borderRadius: 2,
    marginRight: 8,
  },
  qualityText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  sensorData: {
    gap: 2,
  },
  dataText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  warningText: {
    color: colors.white,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statusText: {
    color: colors.white,
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: colors.orange,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  gracePeriodIndicator: {
    backgroundColor: colors.orange,
    padding: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  gracePeriodText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  calibrationIndicator: {
    backgroundColor: colors.orange,
    padding: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  calibrationText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  calibrationCompleteIndicator: {
    backgroundColor: colors.green,
    padding: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  calibrationCompleteText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
}) 