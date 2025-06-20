import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert, Image, Animated, ScrollView } from 'react-native';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { CameraPreview, CameraPreviewRef } from '../../components/camera-preview/camera-preview';
import { SensorMonitor } from '../../components/sensor-monitor';
import { colors } from '../../theme/colors';
import { Video, ResizeMode } from 'expo-av';
import AIAnalysisResult from '../../components/ai-analysis/AIAnalysisResult';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import Constants from 'expo-constants';

// Helper to get the correct API URL based on the platform
const getApiBaseUrl = () => {
  // Replace 'YOUR_COMPUTER_LOCAL_IP' with your computer's local IP address
  // Example: '192.168.1.100'
  const LOCAL_IP = '192.168.68.162'; // TODO: Replace with your computer's local IP
  
  // Use localhost for web and Android emulator, local IP for physical devices
  if (Constants.appOwnership === 'expo') {
    return `http://${LOCAL_IP}:8000`;
  }
  
  // For iOS simulator and Android emulator
  return 'http://10.0.2.2:8000';
};

const API_BASE_URL = getApiBaseUrl();

type AIAnalysisResponse = {
  success: boolean;
  data: {
    car_info: {
      make: string;
      model: string;
      year: string;
      confidence: number;
    };
    license_plate: {
      number: string;
      confidence: number;
    };
    damages: Array<{
      type: string;
      location: string;
      length_cm: number;
      depth_mm: number;
      visibility: string;
      severity: string;
      confidence: number;
    }>;
    mileage: {
      estimated_km: number;
      confidence: number;
      estimation_method: string;
    };
    condition_and_price: {
      condition: string;
      price_estimate_lakhs: number;
    };
    frame_count: number;
    frames_processed: number;
  };
};

// Analyzing screen
function Analyzing() {
  return (
    <View style={styles.analyzingContainer}>
      <ActivityIndicator size="large" color={colors.orange} />
      <Text style={[styles.analyzingText, { marginTop: 20, fontSize: 20 }]}>Analyzing.....</Text>
      <Text style={[styles.analyzingText, { fontWeight: 'normal', fontSize: 14 }]}>AI is analyzing the truck condition</Text>
    </View>
  );
}

export default function ScanScreen() {
  const [currentScreenView, setCurrentScreenView] = useState<'selection' | 'cameraFlow'>('selection');
  const cameraRef = useRef<CameraPreviewRef>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastFadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity: 0
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start/stop recording handlers
  async function handleRecord() {
    console.log('🎬 Record button pressed');
    console.log('📱 Current state:', { videoUri, isRecording, isAnalyzing, showResult });
    
    if (!cameraRef.current) {
      console.error('❌ Camera ref is null');
      Alert.alert('Error', 'Camera is not ready');
      return;
    }
    
    try {
      console.log('🔄 Setting recording state to true');
      setIsRecording(true);
      
      console.log('🎥 Calling cameraRef.current.startRecording()');
      await cameraRef.current.startRecording();
      
      console.log('✅ startRecording completed');
    } catch (error) {
      console.error('❌ Error in handleRecord:', error);
      Alert.alert('Recording Error', `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('🔄 Setting recording state to false');
      setIsRecording(false);
    }
  }
  
  async function handleStop() {
    await cameraRef.current?.stopRecording();
  }
  
  function handleVideoRecorded(uri: string) {
    setVideoUri(uri);
  }
  
  async function analyzeVideo(uri: string) {
    if (!uri) {
      console.error('No video URI provided');
      return;
    }

    console.log('Starting video analysis for URI:', uri);
    setIsAnalyzing(true);
    setError(null);

    try {
      // Get file info to verify it exists
      console.log('Checking if file exists:', uri);
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        const errorMsg = `Video file not found at: ${uri}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Create form data to send the file
      console.log('Creating form data...');
      const formData = new FormData();
      const file = {
        uri,
        name: 'video.mp4',
        type: 'video/mp4',
      };
      console.log('File object:', file);
      
      formData.append('video', file as any);

      console.log('Sending request to server...');
      const apiUrl = `${API_BASE_URL}/api/assess/video/`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
          console.error('API Error Response:', errorText);
        } catch (e) {
          console.error('Failed to read error response:', e);
          errorText = 'No error details available';
        }
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      console.log('Parsing response JSON...');
      const result = await response.json();
      console.log('API Response:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('Analysis successful, updating UI...');
        setAnalysisResult(result);
        setShowResult(true);
      } else {
        const errorMsg = result.message || 'Analysis failed';
        console.error('Analysis failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error analyzing video:', {
        message: errorMessage,
        error: err,
        stack: err instanceof Error ? err.stack : undefined,
      });
      
      setError(`Failed to analyze video: ${errorMessage}`);
      Alert.alert('Error', `Failed to analyze video: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleRetake() {
    setVideoUri(null);
    setShowResult(false);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setError(null);
    
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
  
  async function handleSubmit() {
    if (videoUri) {
      await analyzeVideo(videoUri);
    } else {
      Alert.alert('Error', 'No video to analyze');
    }
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
            <Image source={require('../../assets/truck.jpg')} style={styles.truckImage} resizeMode="contain" />
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
        {showResult && analysisResult?.data && (
          <View style={styles.fullScreenContainer}>
            <AIAnalysisResult data={analysisResult.data} />
          </View>
        )}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Camera and other content remains here */}
        
        <View style={styles.buttonRow}>
          {!videoUri && !isRecording && !isAnalyzing && !showResult && (
            <TouchableOpacity style={styles.recordButton} onPress={handleRecord}>
              <Text style={styles.buttonText}>Record</Text>
            </TouchableOpacity>
          )}
          {isRecording && !isAnalyzing && !showResult && (
            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.buttonText}>Stop</Text>
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
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
    width: '100%',
  },
  fullScreenContainer: {
    flex: 1,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    width: '100%',
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
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
  retakeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginRight: 8,
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
    fontSize: 16,
  },
  submitText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  backToSelectionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFF9F5',  // Light orange background
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#FFE8D9',
    marginBottom: 24,
    
  },
  backToSelectionButtonText: {
    color: colors.orange,
    fontSize: 14,
    fontWeight: '400',
    marginLeft: 6,
  },
  videoPreview: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: 'black',
    borderRadius: 12,
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.orange,
    fontWeight: 'bold',
  },
  resultContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    maxHeight: '80%',
  },
  resultContent: {
    flexGrow: 1,
    width: '100%',
  },
  errorContainer: {
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    margin: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  toastOverlay: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  toastBanner: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 14,
  },
  selectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    elevation: 2,
  },
  imageContainerWithBrackets: {
    width: '100%',
    aspectRatio: 1.5,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  truckImage: {
    width: '100%',
    height: '100%',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.orange,
    borderWidth: 2,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  selectionButtonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 8,
    alignItems: 'center',
  },
  scanButton: {
    flex: 1,
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    marginLeft: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: colors.orange,
    fontWeight: '600',
    fontSize: 16,
  },
  scanButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  goBackButton: {
    marginTop: 24,
    padding: 12,
    alignItems: 'center',
  },
  goBackButtonText: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: '500',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: colors.orange,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  resultLabel: {
    width: 120,
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});