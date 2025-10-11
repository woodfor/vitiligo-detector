import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { runOnJS } from 'react-native-reanimated';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { styles } from './styles';

export default function Index() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    setHasPermission(permission === 'granted');
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    // TODO: Add vitiligo detection logic here
    // This is where you'll process each frame for vitiligo detection

    // Example frame processing structure:
    // 1. Convert frame to image format (if needed)
    // 2. Apply image preprocessing (resize, normalize, etc.)
    // 3. Run vitiligo detection algorithm
    // 4. Process results and update UI

    // For now, just log frame information
    console.log(`Processing frame: ${frame.width}x${frame.height}, timestamp: ${frame.timestamp}`);

    // Example: Access frame properties
    // - frame.width: frame width in pixels
    // - frame.height: frame height in pixels
    // - frame.timestamp: frame timestamp
    // - frame.pixelFormat: pixel format (e.g., 'yuv', 'rgb', etc.)

    // Process frame data and send results to JS thread
    runOnJS(processFrameData)({
      width: frame.width,
      height: frame.height,
      timestamp: frame.timestamp,
      // Add detection results here when implemented
      hasVitiligo: false, // placeholder
      confidence: 0.0, // placeholder
    });
  }, []);

  const processFrameData = (data: {
    width: number;
    height: number;
    timestamp: number;
    hasVitiligo: boolean;
    confidence: number;
  }) => {
    // This function runs on the JS thread
    // You can update UI state here based on frame processing results
    console.log('Frame processed:', data);

    // TODO: Update UI based on detection results
    // Example: Show detection overlay, update confidence indicator, etc.
    if (data.hasVitiligo) {
      console.log(`Vitiligo detected with confidence: ${data.confidence}`);
    }
  };

  const toggleCamera = () => {
    setIsActive(!isActive);
  };

  if (!hasPermission) {
    return (
      <ParallaxScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
        headerBackgroundColor={{
          light: '#000',
          dark: '#1D3D47',
        }}
      >
        <Text style={styles.text}>Camera permission required</Text>
        <TouchableOpacity style={cameraStyles.button} onPress={checkCameraPermission}>
          <Text style={cameraStyles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </ParallaxScrollView>
    );
  }

  if (!device) {
    return (
      <ParallaxScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
        headerBackgroundColor={{
          light: '#000',
          dark: '#1D3D47',
        }}
      >
        <Text style={styles.text}>No camera device found</Text>
      </ParallaxScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {isActive ? (
        <View style={cameraStyles.cameraContainer}>
          <Camera style={cameraStyles.camera} device={device} isActive={isActive} frameProcessor={frameProcessor} />
          <View style={cameraStyles.overlay}>
            <TouchableOpacity style={cameraStyles.stopButton} onPress={toggleCamera}>
              <Text style={cameraStyles.buttonText}>Stop Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ParallaxScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
          headerBackgroundColor={{
            light: '#000',
            dark: '#1D3D47',
          }}
        >
          <Text style={styles.text}>Vitiligo Detector</Text>
          <TouchableOpacity style={cameraStyles.button} onPress={toggleCamera}>
            <Text style={cameraStyles.buttonText}>Start Camera</Text>
          </TouchableOpacity>
        </ParallaxScrollView>
      )}
    </View>
  );
}

const cameraStyles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
