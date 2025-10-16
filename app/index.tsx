import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, Image, Alert, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { File, Paths } from 'expo-file-system';

import CameraComponent from '@/components/camera';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import VitiligoDetectionOverlay from '@/components/vitiligo-detection-overlay';
import FullscreenImageViewer from '@/components/fullscreen-image-viewer';
import { useVitiligoDetection, VitiligoDetectionResult } from '@/services/vitiligoModel';
import { processImageForModel } from '@/utils/imageProcessor';
import { cameraStyles, styles } from './styles';

export default function Index() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [savedImageUri, setSavedImageUri] = useState<string | null>(null);
  const [showSavedImage, setShowSavedImage] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  const [detectionResult, setDetectionResult] = useState<VitiligoDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [showFullscreenViewer, setShowFullscreenViewer] = useState(false);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'front');

  // Use the vitiligo detection hook
  const { status, detectVitiligo, isModelReady } = useVitiligoDetection();

  useEffect(() => {
    checkCameraPermission();
    checkForExistingSavedImage();
  }, []);

  // Log model loading status
  useEffect(() => {
    console.log('Model status:', status);
    if (status === 'loaded') {
      console.log('Model loaded successfully');
    } else if (status === 'error') {
      console.error('Failed to load model');
      Alert.alert('Model Error', 'Failed to load the vitiligo detection model. Some features may not work.');
    }
  }, [status]);

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

  const detectVitiligoInSavedImage = async () => {
    if (!savedImageUri || !isModelReady) {
      Alert.alert('Error', 'No saved image or model not ready');
      return;
    }

    try {
      setIsDetecting(true);
      console.log('Starting vitiligo detection...');

      // Process the image for the model
      const processedImage = await processImageForModel(savedImageUri);
      console.log('Image processed for model:', processedImage.width, 'x', processedImage.height);

      // Run vitiligo detection using the hook
      const result = await detectVitiligo(processedImage);
      console.log('Detection result:', result);

      setDetectionResult(result);

      // Show result alert and then open fullscreen viewer
      const message = result.hasVitiligo
        ? `Vitiligo detected with ${Math.round(result.confidence * 100)}% confidence`
        : `No vitiligo detected (${Math.round(result.confidence * 100)}% confidence)`;

      Alert.alert('Detection Complete', message, [
        {
          text: 'View Results',
          onPress: () => setShowFullscreenViewer(true),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]);
    } catch (error) {
      console.error('Error during vitiligo detection:', error);
      Alert.alert('Detection Error', 'Failed to analyze the image for vitiligo');
    } finally {
      setIsDetecting(false);
    }
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
            <>
              <TouchableOpacity style={cameraStyles.button} onPress={toggleSavedImage}>
                <Text style={cameraStyles.buttonText}>{showSavedImage ? 'Hide Saved Image' : 'View Saved Image'}</Text>
              </TouchableOpacity>
              {isModelReady && (
                <TouchableOpacity
                  style={[cameraStyles.button, { marginTop: 10 }]}
                  onPress={detectVitiligoInSavedImage}
                  disabled={isDetecting}
                >
                  {isDetecting ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                      <Text style={cameraStyles.buttonText}>Analyzing...</Text>
                    </View>
                  ) : (
                    <Text style={cameraStyles.buttonText}>Detect Vitiligo</Text>
                  )}
                </TouchableOpacity>
              )}
              {detectionResult && (
                <TouchableOpacity
                  style={[cameraStyles.button, { marginTop: 10 }]}
                  onPress={() => setShowFullscreenViewer(true)}
                >
                  <Text style={cameraStyles.buttonText}>View Fullscreen Results</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {showSavedImage && savedImageUri && (
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={styles.text}>Saved Frame:</Text>
              <View style={{ position: 'relative', marginTop: 10 }}>
                <Image
                  key={`${imageKey}-${savedImageUri}`} // Force re-render with both key and URI
                  source={{
                    uri: savedImageUri,
                    cache: 'reload', // Force reload from source
                  }}
                  style={{
                    width: 300,
                    height: 200,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: '#007AFF',
                  }}
                  resizeMode="contain"
                  onLoad={(event) => {
                    // Store image dimensions for overlay positioning
                    const { width, height } = event.nativeEvent.source;
                    console.log('Image loaded with dimensions:', width, 'x', height);
                    setImageDimensions({ width, height });
                  }}
                />
                {detectionResult && imageDimensions && (
                  <VitiligoDetectionOverlay
                    detectionResult={detectionResult}
                    imageWidth={imageDimensions.width}
                    imageHeight={imageDimensions.height}
                    containerWidth={300}
                    containerHeight={200}
                  />
                )}
              </View>
            </View>
          )}
        </ParallaxScrollView>
      )}

      {/* Fullscreen Image Viewer */}
      <FullscreenImageViewer
        visible={showFullscreenViewer}
        imageUri={savedImageUri || ''}
        detectionResult={detectionResult}
        imageDimensions={imageDimensions}
        onClose={() => setShowFullscreenViewer(false)}
      />

      {/* Debug info */}
      {showFullscreenViewer && (
        <View style={{ position: 'absolute', top: 100, left: 10, backgroundColor: 'rgba(0,0,0,0.8)', padding: 10 }}>
          <Text style={{ color: 'white', fontSize: 12 }}>
            Debug: imageDimensions = {imageDimensions ? `${imageDimensions.width}x${imageDimensions.height}` : 'null'}
          </Text>
          <Text style={{ color: 'white', fontSize: 12 }}>savedImageUri = {savedImageUri ? 'present' : 'null'}</Text>
        </View>
      )}
    </View>
  );
}
