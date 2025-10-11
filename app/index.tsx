import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

import CameraComponent from '@/components/camera-component';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { cameraStyles, styles } from './styles';

export default function Index() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    setHasPermission(permission === 'granted');
  };

  const handleFrameProcessed = (data: {
    width: number;
    height: number;
    timestamp: number;
    hasVitiligo: boolean;
    confidence: number;
  }) => {
    // Handle frame processing results from the camera component
    console.log('Frame processed in main component:', data);

    // TODO: Update main UI state based on detection results
    // Example: Show detection overlay, update confidence indicator, etc.
    if (data.hasVitiligo) {
      console.log(`Vitiligo detected with confidence: ${data.confidence}`);
    }
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
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
      {isCameraActive ? (
        <CameraComponent
          device={device}
          isActive={isCameraActive}
          onToggleCamera={toggleCamera}
          onFrameProcessed={handleFrameProcessed}
        />
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
