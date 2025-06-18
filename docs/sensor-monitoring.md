# Sensor Monitoring System for Truck Scanning

## Overview

The sensor monitoring system provides real-time quality assurance during truck scanning by tracking device orientation, camera angles, and user movement patterns. This ensures optimal video quality and proper scanning technique.

## Features

### 1. Angle Detection (Device Orientation & Camera Angle)

#### How It Works
- **Gyroscope**: Tracks rotation around X, Y, and Z axes
- **Accelerometer**: Measures linear acceleration to calculate pitch and roll
- **DeviceMotion**: Provides more accurate orientation data using device motion sensors

#### Key Metrics
- **Pitch**: Forward/backward tilt (X-axis rotation)
- **Roll**: Left/right tilt (Y-axis rotation)
- **Yaw**: Left/right rotation (Z-axis rotation)

#### Quality Thresholds
```typescript
const QUALITY_THRESHOLDS = {
  maxPitchTilt: 25,    // Allow 25° of pitch tilt (realistic for walking)
  maxRollTilt: 25,     // Allow 25° of roll tilt (realistic for walking)
  minYawProgress: 60,  // At least 60% of full circle (more realistic)
  maxYawProgress: 140, // No more than 140% of full circle
  gracePeriodSeconds: 5, // 5 seconds grace period before warnings
  warningCooldownSeconds: 3, // 3 seconds between warnings
}
```

#### Real-time Monitoring
- Updates at 10Hz (100ms intervals) for smooth tracking
- Provides immediate feedback on device orientation
- Warns users when device is too tilted or not level

#### Real-world Optimizations
- **Grace Period**: 5-second grace period allows users to get into position
- **Warning Cooldown**: 3-second cooldown prevents spam warnings
- **Realistic Tilt Limits**: 25° tolerance accounts for natural walking movement
- **Progressive Scoring**: Quality score improves as user gets better
- **Contextual Warnings**: Yaw warnings only appear after 10 seconds of recording

### 2. Yaw Detection (User Circling Around Truck)

The yaw detection system tracks how much the user has rotated around the truck:

#### **How It Works:**
1. **Sensor Calibration**: 2-second calibration phase to establish baseline
2. **Rotation Integration**: Integrates gyroscope data over time to track actual rotation
3. **Progress Calculation**: Converts rotation to percentage of full circle
4. **Sensitivity Filtering**: Only counts rotations above threshold to avoid noise

#### **Technical Implementation:**
```typescript
// Yaw integration over time
const deltaTime = (currentTime - lastTime) / 1000
const yawRate = gyroData.z // radians per second
yawIntegration += yawRate * deltaTime

// Progress calculation
const yawDegrees = Math.abs(yawIntegration) * (180 / Math.PI)
const yawProgress = (yawDegrees / 360) * 100
```

#### **Quality Thresholds:**
```typescript
yawSensitivity: 0.5,        // Minimum rotation rate to count (rad/s)
yawCalibrationTime: 2,      // Time to calibrate sensor (seconds)
minYawProgress: 60,         // Minimum circling required (%)
maxYawProgress: 140,        // Maximum circling allowed (%)
```

#### **User Experience:**
- **Calibration Phase**: "🔧 Calibrating sensors..." for 2 seconds
- **Ready Phase**: "✅ Sensors calibrated - Start circling around truck"
- **Progress Tracking**: Real-time percentage as user circles
- **Quality Warnings**: Only after 10 seconds of recording

## Implementation Details

### Sensor Permissions

#### iOS
```json
{
  "NSMotionUsageDescription": "This app needs access to device motion sensors to ensure quality scanning and detect proper circling around the truck."
}
```

#### Android
```json
{
  "permissions": [
    "android.permission.HIGH_SAMPLING_RATE_SENSORS"
  ]
}
```

### Component Architecture

#### SensorMonitor Component
- **Location**: `components/sensor-monitor/sensor-monitor.tsx`
- **Purpose**: Main sensor monitoring logic
- **Features**:
  - Permission handling
  - Sensor availability checking
  - Real-time data processing
  - Quality scoring
  - Warning system

#### CircularProgress Component
- **Location**: `components/circular-progress/circular-progress.tsx`
- **Purpose**: Visual yaw progress indicator
- **Features**:
  - SVG-based circular progress
  - Customizable colors and sizes
  - Smooth animations

### Integration with Scan Screen

#### Quality Warning System
```typescript
function handleQualityWarning(warning: string) {
  setQualityWarning(warning)
  console.log('⚠️ Quality warning:', warning)
}

function handleQualityGood() {
  setQualityWarning(null)
  console.log('✅ Quality is good')
}
```

#### Visual Feedback
- **Quality Score**: 0-100% real-time quality indicator
- **Warning Banner**: Prominent display of quality issues
- **Sensor Data**: Live pitch, roll, and yaw values
- **Status Indicators**: ✅/❌ for level and upright status

## Quality Scoring Algorithm

### Score Calculation
```typescript
function getQualityScore(): number {
  let score = 100

  // Deduct points for tilt
  if (!sensorData.isLevel) score -= 20
  if (!sensorData.isUpright) score -= 15

  // Deduct points for incomplete circling
  if (sensorData.yawProgress < QUALITY_THRESHOLDS.minYawProgress) {
    score -= Math.max(0, 30 - (sensorData.yawProgress / 100) * 30)
  }

  return Math.max(0, score)
}
```

### Scoring Breakdown
- **Perfect Score**: 100%
- **Level Penalty**: -20 points if device not level
- **Upright Penalty**: -15 points if device too tilted
- **Circling Penalty**: Up to -30 points for incomplete circling

## User Experience

### During Recording
1. **Sensor Monitor Overlay**: Shows real-time quality metrics
2. **Quality Bar**: Visual indicator of overall scan quality
3. **Live Data**: Pitch, roll, yaw values and status indicators
4. **Warning System**: Immediate feedback for quality issues

### Quality Warnings
- **"Keep device level for better scan quality"**: When pitch/roll exceeds thresholds
- **"Device is too tilted - hold upright"**: When device is significantly tilted
- **"Continue circling - X% complete"**: When yaw progress is insufficient
- **"Too much circling - stop recording"**: When user circles too much

### Best Practices
1. **Hold Device Level**: Keep device within 15° of level
2. **Maintain Upright Position**: Avoid extreme tilting
3. **Complete Full Circle**: Circle around truck completely (80-120% progress)
4. **Smooth Movement**: Avoid jerky or erratic motion
5. **Consistent Distance**: Maintain consistent distance from truck

## Technical Considerations

### Performance
- **Update Frequency**: 10Hz for smooth real-time monitoring
- **Battery Impact**: Minimal due to efficient sensor usage
- **Memory Usage**: Lightweight with efficient data structures

### Cross-Platform Compatibility
- **iOS**: Full support for all sensors
- **Android**: Full support with high sampling rate permission
- **Web**: Limited support (may not work on all browsers)

### Error Handling
- **Permission Denied**: Graceful fallback with user guidance
- **Sensors Unavailable**: Informative messages for unsupported devices
- **Data Errors**: Robust error handling for sensor data issues

## Future Enhancements

### Potential Improvements
1. **Machine Learning**: AI-powered quality assessment
2. **Advanced Analytics**: Detailed scanning pattern analysis
3. **Custom Thresholds**: User-adjustable quality parameters
4. **Haptic Feedback**: Vibration alerts for quality issues
5. **Audio Guidance**: Voice prompts for optimal scanning

### Additional Sensors
1. **Magnetometer**: Enhanced orientation detection
2. **Barometer**: Altitude tracking for 3D positioning
3. **GPS**: Location-based quality assessment

## References

- [Expo Sensors Documentation](https://docs.expo.dev/versions/latest/sdk/sensors/)
- [DeviceMotion API](https://docs.expo.dev/versions/latest/sdk/devicemotion/)
- [Gyroscope API](https://docs.expo.dev/versions/latest/sdk/gyroscope/)
- [Accelerometer API](https://docs.expo.dev/versions/latest/sdk/accelerometer/) 