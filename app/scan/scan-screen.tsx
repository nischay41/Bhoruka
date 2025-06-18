import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native'
import React, { useRef, useState } from 'react'
import { CameraPreview, CameraPreviewRef } from '../../components/camera-preview/camera-preview'
import { SensorMonitor } from '../../components/sensor-monitor'
import { colors } from '../../theme/colors'
import { Video, ResizeMode } from 'expo-av'

// Dummy AI result component
function AIResult() {
  return (
    <View style={styles.resultContainer}>
      <Text style={styles.resultTitle}>AI-Detected Information</Text>
      <View style={styles.resultRow}><Text style={styles.resultLabel}>Number Plate:</Text><Text style={styles.resultValue}>MH20GH3456</Text></View>
      <View style={styles.resultRow}><Text style={styles.resultLabel}>Make:</Text><Text style={styles.resultValue}>Tata</Text></View>
      <View style={styles.resultRow}><Text style={styles.resultLabel}>Model:</Text><Text style={styles.resultValue}>Ultra 1918.T</Text></View>
      <View style={styles.resultRow}><Text style={styles.resultLabel}>Year:</Text><Text style={styles.resultValue}>2022</Text></View>
    </View>
  )
}

// Analyzing screen
function Analyzing() {
  return (
    <View style={styles.analyzingContainer}>
      <ActivityIndicator size="large" color={colors.orange} />
      <Text style={styles.analyzingTitle}>Analyzing.....</Text>
      <Text style={styles.analyzingDesc}>AI is analyzing the truck condition</Text>
    </View>
  )
}

export default function ScanScreen() {
  const cameraRef = useRef<CameraPreviewRef>(null)
  const [videoUri, setVideoUri] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [qualityWarning, setQualityWarning] = useState<string | null>(null)

  // Start/stop recording handlers
  async function handleRecord() {
    console.log('🎬 Record button pressed')
    console.log('📱 Current state:', { videoUri, isRecording, isAnalyzing, showResult })
    
    if (!cameraRef.current) {
      console.error('❌ Camera ref is null')
      Alert.alert('Error', 'Camera is not ready')
      return
    }
    
    try {
      console.log('🔄 Setting recording state to true')
      setIsRecording(true)
      
      console.log('🎥 Calling cameraRef.current.startRecording()')
      await cameraRef.current.startRecording()
      
      console.log('✅ startRecording completed')
    } catch (error) {
      console.error('❌ Error in handleRecord:', error)
      Alert.alert('Recording Error', `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      console.log('🔄 Setting recording state to false')
      setIsRecording(false)
    }
  }
  
  async function handleStop() {
    await cameraRef.current?.stopRecording()
  }
  
  function handleVideoRecorded(uri: string) {
    setVideoUri(uri)
  }
  
  function handleRetake() {
    setVideoUri(null)
    setShowResult(false)
    setIsAnalyzing(false)
    setQualityWarning(null)
  }
  
  function handleSubmit() {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      setShowResult(true)
    }, 2000)
  }

  // Quality monitoring callbacks
  function handleQualityWarning(warning: string) {
    setQualityWarning(warning)
    console.log('⚠️ Quality warning:', warning)
  }

  function handleQualityGood() {
    setQualityWarning(null)
    console.log('✅ Quality is good')
  }

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {!videoUri && !isAnalyzing && !showResult && (
          <CameraPreview ref={cameraRef} onVideoRecorded={handleVideoRecorded} maxDurationSec={180} />
        )}
        {videoUri && !isAnalyzing && !showResult && (
          <Video
            source={{ uri: videoUri }}
            style={styles.videoPreview}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isLooping={false}
          />
        )}
        {isAnalyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={colors.orange} />
            <Text style={styles.analyzingText}>Analyzing…</Text>
          </View>
        )}
        {showResult && <AIResult />}
        
        {/* Quality warning banner */}
        {qualityWarning && (
          <View style={styles.qualityWarningBanner}>
            <Text style={styles.qualityWarningText}>⚠️ {qualityWarning}</Text>
          </View>
        )}
        
        <View style={styles.buttonRow}>
          {!videoUri && !isRecording && !isAnalyzing && !showResult && (
            <TouchableOpacity style={styles.recordButton} onPress={handleRecord}>
              <Text style={styles.recordText}>Record</Text>
            </TouchableOpacity>
          )}
          {isRecording && !isAnalyzing && !showResult && (
            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.stopText}>Stop</Text>
            </TouchableOpacity>
          )}
          {videoUri && !isAnalyzing && !showResult && (
            <>
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      {/* Sensor Monitor - only show during recording */}
      <SensorMonitor 
        isRecording={isRecording}
        onQualityWarning={handleQualityWarning}
        onQualityGood={handleQualityGood}
        testMode={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: 16,
    alignItems: 'center',
    width: '95%',
    maxWidth: 420,
    alignSelf: 'center',
    elevation: 2,
    minHeight: 500,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    width: '100%',
  },
  recordButton: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 8,
    alignItems: 'center',
  },
  stopButton: {
    flex: 1,
    backgroundColor: 'red',
    borderRadius: 12,
    paddingVertical: 14,
    marginLeft: 8,
    alignItems: 'center',
  },
  recordText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  stopText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  retakeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 8,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    marginLeft: 8,
    alignItems: 'center',
  },
  retakeText: {
    color: colors.orange,
    fontWeight: 'bold',
    fontSize: 18,
  },
  submitText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  videoPreview: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    backgroundColor: '#000',
    marginTop: 8,
  },
  analyzingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 60,
  },
  analyzingTitle: {
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 24,
    color: colors.orange,
  },
  analyzingDesc: {
    color: '#888',
    fontSize: 16,
    marginTop: 8,
  },
  analyzingText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.orange,
    fontWeight: 'bold',
  },
  resultContainer: {
    backgroundColor: '#f5faff',
    borderRadius: 16,
    padding: 24,
    marginTop: 32,
    width: '100%',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#b3d1ff',
  },
  resultTitle: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#1976d2',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  resultLabel: {
    fontWeight: 'bold',
    color: '#333',
    width: 150,
  },
  resultValue: {
    color: '#222',
    fontWeight: '600',
  },
  qualityWarningBanner: {
    backgroundColor: colors.orange,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  qualityWarningText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
}) 