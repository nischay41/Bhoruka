import React, { useEffect, useState, useRef } from 'react';
import { Alert } from 'react-native';
import { Gyroscope } from 'expo-sensors';

type StabilityStatus = 'Stable' | 'Slightly Shaky' | 'Very Shaky';

interface SensorMonitorProps {
  isRecording: boolean;
  onQualityWarning?: (warning: string) => void;
  onQualityGood?: () => void;
}

const STABILITY_THRESHOLDS = {
  stable: 1.0,       // rad/s, for gyroscope magnitude
  slightlyShaky: 2.5 // rad/s, for gyroscope magnitude
};

export function SensorMonitor({ isRecording, onQualityWarning, onQualityGood }: SensorMonitorProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [stabilityStatus, setStabilityStatus] = useState<StabilityStatus>('Stable');
  
  const lastWarningRef = useRef<string | null>(null);

  // 1. Request permissions and check for sensor availability on mount
  useEffect(() => {
    async function setupSensors() {
      try {
        const { status } = await Gyroscope.requestPermissionsAsync();
        if (status === 'granted') {
          setHasPermission(true);
          const available = await Gyroscope.isAvailableAsync();
          setIsAvailable(available);
          if (!available) {
            console.warn('Gyroscope is not available on this device.');
          }
        } else {
          setHasPermission(false);
          Alert.alert('Permission Required', 'Gyroscope permission is needed for stability detection.');
        }
      } catch (error) {
        console.error('Error setting up gyroscope:', error);
        setHasPermission(false);
      }
    }
    setupSensors();
  }, []);

  // 2. Start/stop gyroscope listener based on `isRecording` prop
  useEffect(() => {
    if (!isRecording || !hasPermission || !isAvailable) {
      return;
    }

    let gyroSubscription: any;

    function startMonitoring() {
      console.log('🎯 Starting stability monitoring...');
      Gyroscope.setUpdateInterval(100); // 10Hz

      gyroSubscription = Gyroscope.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        let newStability: StabilityStatus = 'Stable';

        if (magnitude > STABILITY_THRESHOLDS.slightlyShaky) {
          newStability = 'Very Shaky';
        } else if (magnitude > STABILITY_THRESHOLDS.stable) {
          newStability = 'Slightly Shaky';
        }

        if (newStability !== stabilityStatus) {
          setStabilityStatus(newStability);
          
          // Only trigger a warning if we enter the "Very Shaky" state
          if (newStability === 'Very Shaky' && lastWarningRef.current !== 'shaky') {
            onQualityWarning?.('The camera must be stable while recording.');
            lastWarningRef.current = 'shaky';
          } 
          // Trigger good quality only when returning to stable from a shaky state
          else if (newStability === 'Stable' && lastWarningRef.current === 'shaky') {
            onQualityGood?.();
            lastWarningRef.current = null;
          }
        }
      });
    }

    function stopMonitoring() {
      if (gyroSubscription) {
        gyroSubscription.remove();
      }
      lastWarningRef.current = null;
      console.log('🛑 Stopped stability monitoring');
    }

    startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, [isRecording, hasPermission, isAvailable, stabilityStatus]); // re-run if stabilityStatus changes to compare old/new

  // This component does not render any UI itself.
  return null;
}