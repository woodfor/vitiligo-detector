import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { Camera, CameraDevice, useFrameProcessor } from 'react-native-vision-camera';

import { cameraStyles } from '../styles';

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
}

export default function CameraComponent({ device, isActive, onToggleCamera, onFrameProcessed }: CameraComponentProps) {
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

  return (
    <View style={cameraStyles.cameraContainer}>
      <Camera style={cameraStyles.camera} device={device} isActive={isActive} frameProcessor={frameProcessor} />
      <View style={cameraStyles.overlay}>
        <TouchableOpacity style={cameraStyles.stopButton} onPress={onToggleCamera}>
          <Text style={cameraStyles.buttonText}>Stop Camera</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
