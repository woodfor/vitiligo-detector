import React, { useRef } from 'react';
import { Text, TouchableOpacity, View, Alert } from 'react-native';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { Camera, CameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { File, Paths } from 'expo-file-system';

import { cameraStyles } from '../../styles';

interface CameraComponentProps {
  device: CameraDevice;
  isActive: boolean;
  onToggleCamera: () => void;
  onFrameProcessed?: (data: {
    width: number;
    height: number;
    timestamp: number;
    hasVitiligo: boolean;
    confidence: number;
  }) => void;
  onFrameSaved?: (imageUri: string) => void;
}

export default function CameraComponent({
  device,
  isActive,
  onToggleCamera,
  onFrameProcessed,
  onFrameSaved,
}: CameraComponentProps) {
  const cameraRef = useRef<Camera>(null);

  // Shared values to communicate between worklet and JS thread
  const frameData = useSharedValue({
    width: 0,
    height: 0,
    timestamp: 0,
    hasVitiligo: false,
    confidence: 0.0,
  });

  // Listen for changes in frame data and call the callback
  useAnimatedReaction(
    () => frameData.value,
    (current, previous) => {
      if (previous && current.timestamp !== previous.timestamp) {
        // Frame data has changed, call the callback on JS thread
        onFrameProcessed?.(current);
      }
    },
    [onFrameProcessed],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
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

      // Update shared value with frame data
      frameData.value = {
        width: frame.width,
        height: frame.height,
        timestamp: frame.timestamp,
        // Add detection results here when implemented
        hasVitiligo: false, // placeholder
        confidence: 0.0, // placeholder
      };
    },
    [frameData],
  );

  const saveFrame = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert('Error', 'Camera not ready');
        return;
      }

      // Take a photo
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });

      // Create permanent file in document directory
      const permanentFile = new File(Paths.document, 'vitiligo-saved-frame.jpg');

      console.log('Saving to permanent storage:', permanentFile.uri);

      // Delete old file if it exists
      try {
        if (permanentFile.exists) {
          await permanentFile.delete();
        }
      } catch {
        // Ignore if file doesn't exist or can't be deleted
      }

      // Read the temporary file content and write to permanent location
      // Ensure the temporary file path has proper file:// prefix
      const tempFilePath = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      console.log('Original photo path:', photo.path);
      console.log('Fixed temp file path:', tempFilePath);

      const tempFile = new File(tempFilePath);
      const fileContent = await tempFile.bytes();
      await permanentFile.write(fileContent);

      // Clean up temporary file
      try {
        await tempFile.delete();
      } catch {
        // Ignore cleanup errors
      }

      // Use permanent file URI
      onFrameSaved?.(permanentFile.uri);
      console.log('Frame saved permanently:', permanentFile.uri);
    } catch (error) {
      console.error('Error saving frame:', error);
      Alert.alert('Error', 'Failed to save frame');
    }
  };

  return (
    <View style={cameraStyles.cameraContainer}>
      <Camera
        ref={cameraRef}
        style={cameraStyles.camera}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        photo={true}
      />
      <View style={cameraStyles.overlay}>
        <TouchableOpacity style={cameraStyles.stopButton} onPress={onToggleCamera}>
          <Text style={cameraStyles.buttonText}>Stop Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={cameraStyles.button} onPress={saveFrame}>
          <Text style={cameraStyles.buttonText}>Save Frame</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
