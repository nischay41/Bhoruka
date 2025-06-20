import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert, Image, Animated } from 'react-native'
import { router } from 'expo-router'
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
  const [currentScreenView, setCurrentScreenView] = useState<'selection' | 'cameraFlow'>('selection');
  const cameraRef = useRef<CameraPreviewRef>(null)
  const [videoUri, setVideoUri] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastFadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity: 0
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    setVideoUri(null);
    setShowResult(false);
    setIsAnalyzing(false);
    // Fade out the toast if it's visible
    if (toastMessage) {
      Animated.timing(toastFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setToastMessage(null);
        }
      });
    }
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
    // Reset any existing animation and timer
    toastFadeAnim.stopAnimation();
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    
    // Set the new message and fade in
    setToastMessage(warning);
    Animated.timing(toastFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    console.log('🍞 Toast displayed:', warning);
    
    // Set timer to fade out after 2 seconds
    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastFadeAnim, {
        toValue: 0,
        duration: 300, // Slightly longer fade out for smoother feel
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setToastMessage(null);
        }
      });
      toastTimerRef.current = null;
    }, 2000); // Display toast for 2 seconds
  }

  async function handleUploadVideo() {
    Alert.alert("Upload Video", "This feature is not yet implemented. Tapping this would open a document picker to select a video.");
    // Future implementation using expo-document-picker:
    // try {
    //   const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true });
    //   if (!result.canceled && result.assets && result.assets.length > 0) {
    //     console.log('Video picked:', result.assets[0].uri);
    //     setVideoUri(result.assets[0].uri);
    //     // setCurrentScreenView('cameraFlow'); // Or a specific 'previewUpload' state
    //     // handleSubmit(); // Or a similar function for uploaded video
    //   }
    // } catch (err) {
    //   console.error('Error picking video:', err);
    //   Alert.alert("Error", "Could not pick video.");
    // }
  }

  function handleQualityGood() {
    // No need to clear the toast immediately on quality good
    // Let the 2-second timer handle it
    console.log('✅ Quality is good');
  }

  if (currentScreenView === 'selection') {
    return (
      <View style={styles.root}>
        <View style={styles.selectionCard}>
          <View style={styles.imageContainerWithBrackets}>
            <Image source={require('../../assets/tuck.gif')} style={styles.truckImage} resizeMode="contain" />
            <View style={[styles.cornerBracket, styles.topLeft]} />
            <View style={[styles.cornerBracket, styles.topRight]} />
            <View style={[styles.cornerBracket, styles.bottomLeft]} />
            <View style={[styles.cornerBracket, styles.bottomRight]} />
          </View>
          <View style={styles.selectionButtonRow}>
            <TouchableOpacity style={styles.uploadButton} onPress={handleUploadVideo}>
              <Text style={styles.uploadButtonText}>Upload Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanButton} onPress={() => {
              setVideoUri(null);
              setIsAnalyzing(false);
              setShowResult(false);
              // Clear any existing toast with fade out
              if (toastMessage) {
                Animated.timing(toastFadeAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(({ finished }) => {
                  if (finished) {
                    setToastMessage(null);
                  }
                });
              }
              setCurrentScreenView('cameraFlow');
            }}>
              <Text style={styles.scanButtonText}>Scan with Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
          <Text style={styles.goBackButtonText}>‹ Go back to homepage</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // cameraFlow view
  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {/* Toast Overlay - Positioned absolutely over the camera */}
        {toastMessage ? (
          <Animated.View 
            style={[
              styles.toastOverlay, 
              { 
                opacity: toastFadeAnim, 
                transform: [{
                  translateY: toastFadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 10], // Start slightly above final position
                  })
                }]
              }
            ]}
          >
            <View style={styles.toastBanner}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          </Animated.View>
        ) : null}
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
        
        {/* Camera and other content remains here */}
        
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
        <TouchableOpacity onPress={() => setCurrentScreenView('selection')} style={styles.backToSelectionButton}>
          <Text style={styles.backToSelectionButtonText}>‹ Back to Options</Text>
        </TouchableOpacity>
      </View>
      
      {/* Sensor Monitor - only show during recording */}
      <SensorMonitor 
        isRecording={isRecording}
        onQualityWarning={handleQualityWarning}
        onQualityGood={handleQualityGood}

      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    paddingHorizontal: 16, // Add horizontal padding to the root
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: 16,
    alignItems: 'center',
    width: '100%', // Take full width of the padded root
    maxWidth: 420, // Keep max width for larger screens
    alignSelf: 'center',
    elevation: 2,
    // minHeight: 500, // Remove fixed min-height for more flexibility
    aspectRatio: 9 / 17, // Maintain a consistent aspect ratio
    justifyContent: 'space-between', // Distribute space between items
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
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
    flex: 1,
    borderRadius: 24, // Match camera preview's container
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  analyzingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  // Toast overlay container
  toastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Ensure it's above other content
    alignItems: 'center',
    paddingTop: 40, // Position from top of screen
  },
  // Toast banner style
  toastBanner: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent black
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCard: {
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    justifyContent: 'space-around',
    minHeight: '60%',
  },
  imageContainerWithBrackets: {
    width: '100%',
    aspectRatio: 16 / 10, // Adjust aspect ratio as needed for the image
    alignItems: 'center',
  },
  truckImage: {
    width: '80%',
    height: '80%',
  },
  cornerBracket: {
    position: 'absolute',
    width: 30, // Length of bracket arms
    height: 30,
    borderColor: colors.orange, // Color of brackets
    borderWidth: 0, // Base border width, specific sides will be set
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4, // Thickness of brackets
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  selectionButtonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 16,
  },
  uploadButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: colors.orange,
    fontWeight: 'bold',
    fontSize: 16,
  },
  scanButton: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  scanButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  goBackButton: {
    marginTop: 32,
    alignSelf: 'center',
  },
  goBackButtonText: {
    color: colors.orange, // Or a more subtle color like a gray
    fontSize: 16,
    fontWeight: '500',
  },
  backToSelectionButton: {
    alignSelf: 'center',
    padding: 10,
    marginTop: 10,
    backgroundColor: colors.lightGray, // Subtle background
    borderRadius: 8,
  },
  backToSelectionButtonText: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: '500',
  },
  toastText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
}) 