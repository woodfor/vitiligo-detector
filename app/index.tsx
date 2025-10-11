import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, Image, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { File, Paths } from 'expo-file-system';

import CameraComponent from '@/components/camera';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { cameraStyles, styles } from './styles';

export default function Index() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [savedImageUri, setSavedImageUri] = useState<string | null>(null);
  const [showSavedImage, setShowSavedImage] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');

  useEffect(() => {
    checkCameraPermission();
    checkForExistingSavedImage();
  }, []);

  const checkForExistingSavedImage = async () => {
    try {
      // Create file reference using Paths API
      const permanentFile = new File(Paths.document, 'vitiligo-saved-frame.jpg');

      console.log('Checking for existing saved image at:', permanentFile.uri);

      // Check if the permanent file exists
      if (permanentFile.exists) {
        setSavedImageUri(permanentFile.uri);
        console.log('Found existing saved image:', permanentFile.uri);
      } else {
        console.log('No existing saved image found');
      }
    } catch (error) {
      console.error('Error checking for existing saved image:', error);
    }
  };

  const checkCameraPermission = async () => {
    try {
      setPermissionLoading(true);

      // First check current permission status
      const currentPermission = await Camera.getCameraPermissionStatus();
      console.log('Current camera permission:', currentPermission);

      if (currentPermission === 'granted') {
        setHasPermission(true);
        setPermissionLoading(false);
        return;
      }

      // If not granted, request permission
      console.log('Requesting camera permission...');
      const permission = await Camera.requestCameraPermission();
      console.log('Camera permission result:', permission);
      setHasPermission(permission === 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    } finally {
      setPermissionLoading(false);
    }
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

  const handleFrameSaved = (imageUri: string) => {
    // Use a completely different approach - add a random query parameter
    const randomId = Math.random().toString(36).substring(7);
    const cacheBustedUri = `${imageUri}?cache=${randomId}`;
    setSavedImageUri(cacheBustedUri);
    setImageKey((prev) => prev + 1);
    Alert.alert('Success', 'Frame saved successfully!');
  };

  const toggleSavedImage = () => {
    setShowSavedImage(!showSavedImage);
  };

  const PermissionAndDeviceCheckSection = () => {
    if (permissionLoading) {
      return (
        <>
          <Text style={styles.text}>Checking camera permission...</Text>
        </>
      );
    }

    if (!hasPermission) {
      return (
        <>
          <Text style={styles.text}>Camera permission required</Text>
          <TouchableOpacity style={cameraStyles.button} onPress={checkCameraPermission}>
            <Text style={cameraStyles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </>
      );
    }
    return (
      <>
        <Text style={styles.text}>Vitiligo Detector</Text>
        <TouchableOpacity style={cameraStyles.button} onPress={toggleCamera}>
          <Text style={cameraStyles.buttonText}>Start Camera</Text>
        </TouchableOpacity>
      </>
    );
  };

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
          onFrameSaved={handleFrameSaved}
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
          <PermissionAndDeviceCheckSection />
          {savedImageUri && (
            <TouchableOpacity style={cameraStyles.button} onPress={toggleSavedImage}>
              <Text style={cameraStyles.buttonText}>{showSavedImage ? 'Hide Saved Image' : 'View Saved Image'}</Text>
            </TouchableOpacity>
          )}
          {showSavedImage && savedImageUri && (
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={styles.text}>Saved Frame:</Text>
              <Image
                key={`${imageKey}-${savedImageUri}`} // Force re-render with both key and URI
                source={{
                  uri: savedImageUri,
                  cache: 'reload', // Force reload from source
                }}
                style={{
                  width: 300,
                  height: 200,
                  marginTop: 10,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: '#007AFF',
                }}
                resizeMode="contain"
              />
            </View>
          )}
        </ParallaxScrollView>
      )}
    </View>
  );
}
