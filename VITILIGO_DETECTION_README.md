# Vitiligo Detection Feature

This document explains how to use the AI model to detect and mark vitiligo on saved images in the Vitiligo Detector app.

## Overview

The app now includes a complete vitiligo detection system that:

1. Loads a TensorFlow Lite model for vitiligo detection
2. Processes saved images for analysis
3. Displays detection results with visual overlays
4. Shows confidence scores and bounding boxes

## How to Use

### 1. Save an Image

- Start the camera by tapping "Start Camera"
- Take a photo by tapping "Save Frame"
- The image will be saved and you'll return to the main screen

### 2. Analyze the Image

- Tap "View Saved Image" to see the captured photo
- Tap "Detect Vitiligo" to run the AI analysis
- Wait for the analysis to complete (you'll see a loading indicator)

### 3. View Results

- The app will show an alert with the detection results
- If vitiligo is detected, you'll see:
  - Red bounding boxes around affected areas
  - Confidence percentages for each detection
  - Color-coded confidence levels (red = high, orange = medium, yellow = low)

## Technical Implementation

### Files Created/Modified

1. **`app/services/vitiligoModel.ts`** - AI model service

   - Loads the TensorFlow Lite model
   - Handles image preprocessing
   - Runs inference and processes results

2. **`app/utils/imageProcessor.ts`** - Image processing utilities

   - Converts images to model input format
   - Handles resizing and normalization

3. **`app/components/vitiligo-detection-overlay.tsx`** - Visual overlay component

   - Displays bounding boxes and confidence scores
   - Color-codes detection confidence levels

4. **`app/index.tsx`** - Main app integration
   - Added detection button and loading states
   - Integrated overlay with saved image display

### Model Integration

The implementation uses the `useTensorflowModel` hook from `react-native-fast-tflite` for proper model loading and management. The current implementation includes mock output processing for demonstration purposes. To use your actual TensorFlow Lite model:

1. The model loading is handled automatically by the `useTensorflowModel` hook
2. Update the `processModelOutput` function to handle your model's specific output format
3. Adjust the image preprocessing in `imageProcessor.ts` to match your model's requirements
4. The `model.runSync([inputTensor])` call will use your actual model for inference

### Dependencies Added

- `expo-asset`: For loading the model file from assets (added to package.json)
- `react-native-fast-tflite`: For TensorFlow Lite model inference (already present)
- `metro.config.js`: Configuration to recognize `.tflite` files as assets

## Model Requirements

Your TensorFlow Lite model should:

- Accept RGB image input (224x224 pixels recommended)
- Output confidence scores or segmentation masks
- Be optimized for mobile inference

## Customization

### Adjusting Detection Threshold

Modify the threshold in `vitiligoModel.ts`:

```typescript
const threshold = 0.5; // Adjust this value (0.0 to 1.0)
```

### Changing Overlay Colors

Update the color scheme in `vitiligo-detection-overlay.tsx`:

```typescript
const getConfidenceColor = (confidence: number): string => {
  if (confidence > 0.8) return '#FF4444'; // High confidence
  if (confidence > 0.6) return '#FF8800'; // Medium confidence
  // ... customize as needed
};
```

### Model Input Size

Change the input dimensions in `vitiligoModel.ts`:

```typescript
private inputWidth = 224;  // Adjust based on your model
private inputHeight = 224; // Adjust based on your model
```

## Troubleshooting

### Model Loading Issues

- Ensure the model file is in `assets/models/vitiligo_detector.tflite`
- Check that the file is properly included in the app bundle
- Verify the model is compatible with TensorFlow Lite

### Detection Not Working

- Check console logs for error messages
- Verify the model is loaded (should see "Model loaded successfully" in logs)
- Ensure the image is properly processed before detection

### Performance Issues

- Consider reducing input image size for faster processing
- Implement model quantization for smaller file size
- Use background processing for large images

## Future Enhancements

Potential improvements to consider:

1. Real-time detection during camera preview
2. Batch processing of multiple images
3. Export detection results to reports
4. Integration with medical databases
5. Advanced image preprocessing with OpenCV
6. Model retraining capabilities
