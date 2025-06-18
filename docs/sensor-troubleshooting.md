# Sensor Permission Troubleshooting Guide

## 🔧 Common Issues and Solutions

### **Issue: "Sensor permissions required"**

#### **Symptoms:**
- Sensor monitor shows "Sensor permissions required"
- No sensor data is displayed
- Console shows permission errors

#### **Solutions:**

**1. Grant Permissions When Prompted**
- When the app requests motion permissions, tap "Allow"
- If you accidentally denied, go to device Settings > Privacy > Motion & Fitness
- Enable permissions for the Truck app

**2. Retry Permissions**
- Click the "Retry Permissions" button in the sensor monitor
- This will re-request permissions from the system

**3. Check Device Settings**

**iOS:**
- Settings > Privacy & Security > Motion & Fitness
- Find "Truck" app and enable it
- Settings > Privacy & Security > Camera (for video recording)

**Android:**
- Settings > Apps > Truck > Permissions
- Enable "Camera" and "Motion & Fitness" permissions
- Settings > Privacy > Motion & Fitness

**Web Browser:**
- Check browser console for permission errors
- Ensure you're on HTTPS (except localhost)
- Try refreshing the page and granting permissions again

### **Issue: "Core permissions denied"**

#### **Symptoms:**
- Gyroscope and Accelerometer permissions are denied
- DeviceMotion permission might be unavailable

#### **Solutions:**

**1. Manual Permission Grant**
- Go to device Settings
- Find the Truck app
- Enable all motion-related permissions

**2. App Reinstall**
- Uninstall the app
- Reinstall from Expo Go or development build
- Grant permissions when prompted

**3. Check Platform Limitations**
- Some web browsers have limited sensor support
- Test on mobile device for full functionality

### **Issue: "Core sensors not available"**

#### **Symptoms:**
- Permissions granted but sensors not working
- Console shows sensor availability as false

#### **Solutions:**

**1. Device Compatibility**
- Ensure device has gyroscope and accelerometer sensors
- Some older devices may not support all sensors
- Test on different device if available

**2. Platform Support**
- **iOS**: Full sensor support on iPhone/iPad
- **Android**: Full sensor support on most devices
- **Web**: Limited support, varies by browser

**3. Sensor Calibration**
- Move device in figure-8 pattern
- Hold device in portrait orientation
- Avoid magnetic interference

### **Issue: "DeviceMotion not available"**

#### **Symptoms:**
- Basic sensors work but DeviceMotion fails
- Console shows DeviceMotion errors

#### **Solutions:**

**1. This is Normal**
- DeviceMotion is not required for basic functionality
- Gyroscope and Accelerometer provide sufficient data
- App will work with basic sensors only

**2. Platform Differences**
- DeviceMotion support varies by platform
- iOS has better DeviceMotion support
- Web browsers have limited DeviceMotion access

### **Issue: TypeError with reload function**

#### **Symptoms:**
- Console shows "Cannot read property 'reload' of undefined"
- Retry button doesn't work

#### **Solutions:**

**1. Fixed in Latest Version**
- This error has been fixed in the updated code
- Retry button now uses proper retry mechanism
- No longer relies on window.location.reload()

**2. Clear Cache**
- Clear browser cache and reload
- Restart Expo development server
- Clear React Native cache: `npx expo start --clear`

## 🔍 Debugging Steps

### **1. Check Console Logs**
Look for these log messages:
```
🔄 Starting sensor setup...
📋 Requesting Gyroscope permission...
📋 Requesting Accelerometer permission...
🔐 Permission results: {motion: true, gyro: true, accel: true}
📱 Sensor availability: {gyro: true, accel: true, motion: true}
✅ All sensors ready
```

### **2. Test Sensor Functionality**
1. Go to "🧪 Test Sensors" tab
2. Click "Start Test"
3. Move device to see sensor data
4. Check if values change when moving device

### **3. Verify Permissions**
- Check device settings for app permissions
- Ensure motion/fitness permissions are enabled
- Verify camera permissions for video recording

### **4. Platform-Specific Testing**
- **Mobile**: Test on physical device, not simulator
- **Web**: Test on different browsers
- **iOS**: Check Motion & Fitness settings
- **Android**: Check app permissions in settings

## 📱 Platform-Specific Notes

### **iOS**
- Requires explicit motion permissions
- DeviceMotion works well on iOS
- Check Settings > Privacy & Security > Motion & Fitness

### **Android**
- May require HIGH_SAMPLING_RATE_SENSORS permission
- DeviceMotion support varies by device
- Check app permissions in Settings

### **Web**
- Limited sensor support
- Requires HTTPS (except localhost)
- May not work in all browsers
- DeviceMotion often unavailable

## 🚀 Quick Fixes

### **Immediate Actions:**
1. **Grant permissions** when prompted
2. **Click "Retry Permissions"** button
3. **Test on mobile device** instead of web
4. **Clear cache** and restart app
5. **Check device settings** for app permissions

### **If Still Not Working:**
1. **Restart Expo server**: `npx expo start --clear`
2. **Test on different device**
3. **Check browser console** for errors
4. **Verify app.json** configuration
5. **Update Expo SDK** if needed

## 📞 Getting Help

If issues persist:
1. Check console logs for specific error messages
2. Test on different device/platform
3. Verify all permissions are granted
4. Check device sensor support
5. Review platform-specific limitations

The sensor monitoring system is designed to work with basic sensors (gyroscope + accelerometer) even if DeviceMotion is unavailable. Most issues can be resolved by granting proper permissions and testing on a supported device.

## Yaw Calibration Issues

### **Problem: Yaw Progress Shows 0% Even When Moving**

**Symptoms:**
- Yaw progress remains at 0% even when rotating device
- "Continue circling around truck - 0% complete" warning persists
- No progress updates during rotation

**Causes:**
1. **Sensor Calibration**: Gyroscope needs proper calibration
2. **Low Sensitivity**: Rotation rate below detection threshold
3. **Device Interference**: Magnetic interference affecting sensors
4. **Sensor Drift**: Gyroscope baseline has drifted over time

**Solutions:**

#### **1. Complete Calibration Process**
- **Wait for calibration**: Allow 2-second calibration phase to complete
- **Keep device still**: Don't move during "🔧 Calibrating sensors..." phase
- **Check completion**: Look for "✅ Sensors calibrated" message

#### **2. Increase Rotation Speed**
- **Rotate faster**: Gyroscope detects rotation rate, not position
- **Minimum threshold**: 0.5 radians/second (about 28° per second)
- **Smooth movement**: Avoid jerky or stop-start rotations

#### **3. Calibrate Device Sensors**
Based on [sensor calibration guides](https://stonekick.com/blog/magnometers-accelerometers-and-calibrating-your-android-device.html):

**Android Calibration:**
1. **Remove interference**: Move away from metal objects, cars, computers
2. **Figure-8 pattern**: Wave device in figure-8 pattern for 30 seconds
3. **Multiple rotations**: Rotate device in all directions
4. **Cool down**: Let device cool if it's hot

**iOS Calibration:**
1. **Settings > Privacy > Motion & Fitness**: Ensure motion tracking is enabled
2. **Compass app**: Open compass app and follow calibration instructions
3. **Figure-8 pattern**: Similar to Android calibration process

#### **4. Check Device Settings**
- **Motion permissions**: Ensure app has motion sensor permissions
- **Battery optimization**: Disable battery optimization for the app
- **Background restrictions**: Allow app to run in background

#### **5. Test Sensor Functionality**
```bash
# Check if gyroscope is working
LOG  🔍 Checking Gyroscope availability...
LOG  📱 Sensor availability: {"accel": true, "gyro": true, "motion": true}

# Look for calibration logs
LOG  🔧 Calibrating yaw sensor... 1.2s
LOG  ✅ Yaw calibration complete. Baseline: -0.0234
LOG  🔄 Yaw integration: 0.523 rad/s × 0.100s = 0.052 rad
LOG  📊 Yaw: 0.234 rad (13.4°) = 3.7% progress
```

### **Expected Behavior After Fix:**

#### **Calibration Phase (0-2 seconds):**
```
LOG  🔧 Calibrating yaw sensor... 1.8s
LOG  ✅ Yaw calibration complete. Baseline: -0.0123
```

#### **Active Rotation (2+ seconds):**
```
LOG  🔄 Yaw integration: 0.523 rad/s × 0.100s = 0.052 rad
LOG  📊 Yaw: 0.234 rad (13.4°) = 3.7% progress
LOG  📊 Yaw: 1.234 rad (70.7°) = 19.6% progress
LOG  📊 Yaw: 2.456 rad (140.7°) = 39.1% progress
```

#### **Quality Assessment:**
- **Good progress**: 60%+ circling completion
- **Excellent progress**: 80%+ circling completion
- **Quality score**: Improves with better circling technique 