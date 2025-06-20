import { CameraView, useCameraPermissions, Camera, PermissionStatus } from 'expo-camera'
import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react'
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Platform, Alert } from 'react-native'
import { CornerOverlay } from './corner-overlay'
import { formatTime } from './formatTime'
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
  const [cameraPermission, requestCameraPermission] = useCameraPermissions(); // Renamed for clarity
  const [microphonePermission, setMicrophonePermission] = useState<PermissionStatus | null>(null); // New state for mic permission
  
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const cameraRef = useRef<CameraView | null>(null)

  // Request microphone permission when component mounts or when camera permission is requested
  useEffect(() => {
    (async () => {
      // Silently try to get microphone permission status initially
      // On web, this might not return a useful status until an interaction, but it's good to check.
      const micStatus = await Camera.getMicrophonePermissionsAsync();
      setMicrophonePermission(micStatus.status as PermissionStatus); // Expo's getMicrophonePermissionsAsync returns an object with status
    })();
  }, []);

  const requestAllPermissions = async () => {
    console.log("Requesting all permissions...");
    const camPerm = await requestCameraPermission(); // This is from useCameraPermissions
    const micPerm = await Camera.requestMicrophonePermissionsAsync();
    setMicrophonePermission(micPerm.status as PermissionStatus);
    // Ensure cameraPermission state is also updated if requestCameraPermission doesn't do it automatically
    // (useCameraPermissions hook should handle updating cameraPermission state)
    return { camPerm, micPerm };
  };
  const [orientation, setOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE')

  useImperativeHandle(ref, () => ({
    startRecording: async () => {
      console.log('🔴 Starting recording...')
      setRecordingError(null)
      
      if (!cameraPermission?.granted || microphonePermission !== 'granted') {
                let errorMsg = 'Camera and Microphone permissions are required to record videos.';
        if (!cameraPermission?.granted && microphonePermission !== 'granted') {
            errorMsg = 'Camera and Microphone permissions are required.';
        } else if (!cameraPermission?.granted) {
            errorMsg = 'Camera permission is required.';
        } else {
            errorMsg = 'Microphone permission is required.';
        }
        console.error('❌', errorMsg);
        setRecordingError(errorMsg);
        Alert.alert('Permission Required', errorMsg, [{ text: "Grant Permissions", onPress: requestAllPermissions }, {text: "Cancel", style: "cancel"}]);
        
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
        setElapsedTime(0) // Reset elapsed time
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
        recordingIntervalRef.current = setInterval(() => {
          setElapsedTime((prevTime) => prevTime + 1);
        }, 1000);
        
        console.log('🎬 Calling recordAsync with maxDuration:', maxDurationSec)
        const video = await cameraRef.current.recordAsync({ 
          maxDuration: maxDurationSec
        })
        
        console.log('✅ Recording completed:', video)
        setIsRecording(false)
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        
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
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
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
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
      } else {
        console.log('⚠️ No active recording to stop')
      }
    },
  }), [isRecording, cameraPermission, microphonePermission, orientation, maxDurationSec, onVideoRecorded])

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

    // Initial permission check (before UI shows request button)
  if (!cameraPermission || !microphonePermission) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Loading permissions...</Text></View>;
  
    // If either permission is not granted, show the request UI
  if (!cameraPermission.granted || microphonePermission !== 'granted') return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ textAlign: 'center', marginBottom: 20 }}>
        {Platform.OS === 'web' 
          ? 'We need camera and microphone access to record videos. Please allow access in your browser.'
          : 'We need camera and microphone permissions to record videos.'
        }
      </Text>
      <TouchableOpacity 
        style={{ backgroundColor: '#FF6A00', padding: 12, borderRadius: 8 }}
        onPress={requestAllPermissions}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {Platform.OS === 'web' ? 'Allow Camera & Microphone Access' : 'Grant Permissions'}
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
          <Text style={styles.recordingText}>Recording... {formatTime(elapsedTime)}</Text>
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  cameraContainer: {
    width: '100%',
    flex: 1, // Allow the container to grow and fill the space
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'center',
    maxHeight: '100%', // Ensure it doesn't overflow its parent
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