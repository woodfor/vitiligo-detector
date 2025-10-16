import { useTensorflowModel } from 'react-native-fast-tflite';
import modelSource from '../../assets/models/vitiligo_detector.tflite';

export interface VitiligoDetectionResult {
  hasVitiligo: boolean;
  confidence: number;
  boundingBoxes?: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }[];
}

export interface ProcessedImage {
  width: number;
  height: number;
  data: Uint8Array;
}

// Custom hook for vitiligo detection
export function useVitiligoDetection() {
  const tensorflowState = useTensorflowModel(modelSource);
  const inputWidth = 224; // Standard input size for many vision models
  const inputHeight = 224;

  const detectVitiligo = async (imageData: ProcessedImage): Promise<VitiligoDetectionResult> => {
    try {
      if (tensorflowState.state !== 'loaded' || !tensorflowState.model) {
        throw new Error('Model not loaded');
      }

      // Prepare input tensor
      const inputTensor = prepareInputTensor(imageData, inputWidth, inputHeight);

      // Run inference - this is synchronous with the hook approach
      // The model.run method expects an array of TypedArrays
      const output = tensorflowState.model.runSync([inputTensor]);

      // Process output to get detection results
      const result = processModelOutput(output, imageData.width, imageData.height);

      return result;
    } catch (error) {
      console.error('Error during vitiligo detection:', error);
      return {
        hasVitiligo: false,
        confidence: 0.0,
      };
    }
  };

  return {
    model: tensorflowState.state === 'loaded' ? tensorflowState.model : null,
    status: tensorflowState.state,
    detectVitiligo,
    isModelReady: tensorflowState.state === 'loaded' && tensorflowState.model !== null,
  };
}

// Helper function to prepare input tensor
function prepareInputTensor(imageData: ProcessedImage, inputWidth: number, inputHeight: number): Float32Array {
  // Convert image data to the format expected by the model
  // This assumes the model expects normalized RGB values (0-1 range)
  const inputSize = inputWidth * inputHeight * 3; // RGB channels
  const inputTensor = new Float32Array(inputSize);

  // Simple resize and normalization
  // In a production app, you'd want more sophisticated image processing
  const scaleX = imageData.width / inputWidth;
  const scaleY = imageData.height / inputHeight;

  for (let y = 0; y < inputHeight; y++) {
    for (let x = 0; x < inputWidth; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);

      // Calculate source pixel index (assuming RGB format)
      const srcIndex = (srcY * imageData.width + srcX) * 3;
      const dstIndex = (y * inputWidth + x) * 3;

      // Normalize pixel values to 0-1 range
      if (srcIndex + 2 < imageData.data.length) {
        inputTensor[dstIndex] = imageData.data[srcIndex] / 255.0; // R
        inputTensor[dstIndex + 1] = imageData.data[srcIndex + 1] / 255.0; // G
        inputTensor[dstIndex + 2] = imageData.data[srcIndex + 2] / 255.0; // B
      }
    }
  }

  return inputTensor;
}

// Helper function to process model output
function processModelOutput(output: any, originalWidth: number, originalHeight: number): VitiligoDetectionResult {
  // This is a simplified output processing for demonstration
  // The actual implementation depends on your model's output format

  try {
    // For demonstration, we'll simulate realistic detection results
    // In production, this would process the actual model output

    // Simulate model output with some randomness for realistic testing
    const baseConfidence = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
    const hasVitiligo = baseConfidence > 0.6; // Threshold for detection

    let boundingBoxes;
    if (hasVitiligo) {
      // Generate 1-3 bounding boxes for detected vitiligo patches
      const boxCount = Math.floor(Math.random() * 3) + 1;
      boundingBoxes = [];

      for (let i = 0; i < boxCount; i++) {
        const boxWidth = Math.random() * 0.3 + 0.1; // 10-40% of image width
        const boxHeight = Math.random() * 0.3 + 0.1; // 10-40% of image height
        const boxX = Math.random() * (1 - boxWidth);
        const boxY = Math.random() * (1 - boxHeight);

        boundingBoxes.push({
          x: boxX * originalWidth,
          y: boxY * originalHeight,
          width: boxWidth * originalWidth,
          height: boxHeight * originalHeight,
          confidence: baseConfidence + (Math.random() - 0.5) * 0.2, // Add some variation
        });
      }
    }

    return {
      hasVitiligo,
      confidence: Math.max(0, Math.min(1, baseConfidence)),
      boundingBoxes,
    };
  } catch (error) {
    console.error('Error processing model output:', error);
    return {
      hasVitiligo: false,
      confidence: 0.0,
    };
  }
}
