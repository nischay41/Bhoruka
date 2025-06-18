import { CameraView, useCameraPermissions } from 'expo-camera'
import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react'
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Platform, Alert } from 'react-native'
import { CornerOverlay } from './corner-overlay'
import { ArrowOverlay } from './arrow-overlay'
import * as ScreenOrientation from 'expo-screen-orientation'

export interface CameraPreviewRef {
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
}

interface CameraPreviewProps {
  onVideoRecorded: (uri: string) => void
  maxDurationSec?: number
}

export const CameraPreview = forwardRef<CameraPreviewRef, CameraPreviewProps>(function CameraPreview({ onVideoRecorded, maxDurationSec = 180 }, ref) {
  const [permission, requestPermission] = useCameraPermissions()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const cameraRef = useRef<CameraView | null>(null)
  const [orientation, setOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE')

  useImperativeHandle(ref, () => ({
    startRecording: async () => {
      console.log('🔴 Starting recording...')
      setRecordingError(null)
      
      if (!permission?.granted) {
        const error = 'Camera permission not granted'
        console.error('❌', error)
        setRecordingError(error)
        Alert.alert('Permission Required', 'Camera permission is required to record videos.')
        return
      }
      
      // Skip orientation check on web
      if (Platform.OS !== 'web' && orientation !== 'LANDSCAPE') {
        const error = 'Please rotate your device to landscape to record.'
        console.error('❌', error)
        setRecordingError(error)
        return
      }
      
      if (!cameraRef.current) {
        const error = 'Camera ref is not available'
        console.error('❌', error)
        setRecordingError(error)
        return
      }
      
      if (isRecording) {
        console.log('⚠️ Already recording, ignoring start request')
        return
      }

      try {
        console.log('📹 Setting recording state to true')
        setIsRecording(true)
        
        console.log('🎬 Calling recordAsync with maxDuration:', maxDurationSec)
        const video = await cameraRef.current.recordAsync({ 
          maxDuration: maxDurationSec
        })
        
        console.log('✅ Recording completed:', video)
        setIsRecording(false)
        
        if (video?.uri) {
          console.log('🎥 Video URI:', video.uri)
          onVideoRecorded(video.uri)
        } else {
          console.error('❌ No video URI received')
          setRecordingError('Recording failed - no video URI received')
        }
      } catch (e) {
        console.error('❌ Recording error:', e)
        setIsRecording(false)
        setRecordingError(`Failed to record video: ${e instanceof Error ? e.message : 'Unknown error'}`)
        
        // Show alert for debugging
        Alert.alert('Recording Error', `Error: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    },
    stopRecording: async () => {
      console.log('⏹️ Stopping recording...')
      if (cameraRef.current && isRecording) {
        try {
          cameraRef.current.stopRecording()
          console.log('✅ Stop recording called successfully')
        } catch (e) {
          console.error('❌ Error stopping recording:', e)
        }
        setIsRecording(false)
      } else {
        console.log('⚠️ No active recording to stop')
      }
    },
  }), [isRecording, permission, orientation, maxDurationSec, onVideoRecorded])

  useEffect(() => {
    // Skip orientation detection on web
    if (Platform.OS === 'web') return
    
    const sub = ScreenOrientation.addOrientationChangeListener(({ orientationInfo }) => {
      if (orientationInfo.orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT || orientationInfo.orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT) {
        setOrientation('LANDSCAPE')
      } else {
        setOrientation('PORTRAIT')
      }
    })
    return () => ScreenOrientation.removeOrientationChangeListener(sub)
  }, [])

  if (!permission) return <View style={{ flex: 1 }} />
  
  if (!permission.granted) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ textAlign: 'center', marginBottom: 20 }}>
        {Platform.OS === 'web' 
          ? 'We need camera permission to record videos. Please allow camera access in your browser.'
          : 'We need camera permission to record videos'
        }
      </Text>
      <TouchableOpacity 
        style={{ backgroundColor: '#FF6A00', padding: 12, borderRadius: 8 }}
        onPress={() => requestPermission()}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {Platform.OS === 'web' ? 'Allow Camera Access' : 'Grant Camera Permission'}
        </Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={'back'}
        mode="video"
        ratio={Platform.OS === 'ios' ? '16:9' : undefined}
      />
      <CornerOverlay />
      <ArrowOverlay />
      {recordingError && <Text style={styles.errorText}>{recordingError}</Text>}
      {Platform.OS !== 'web' && orientation !== 'LANDSCAPE' && (
        <View style={styles.landscapePrompt}>
          <Text style={styles.landscapeText}>Please rotate your device to landscape</Text>
        </View>
      )}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>Recording...</Text>
        </View>
      )}
    </View>
  )
})

const previewWidth = Math.min(Dimensions.get('window').width * 0.95, 400)
const previewHeight = previewWidth * 9 / 16

const styles = StyleSheet.create({
  cameraContainer: {
    width: previewWidth,
    height: previewHeight,
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginVertical: 24,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  errorText: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    color: 'red',
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
  },
  landscapePrompt: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  landscapeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 16,
    zIndex: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
}) 