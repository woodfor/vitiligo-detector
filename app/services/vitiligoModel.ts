import { useTensorflowModel } from 'react-native-fast-tflite';
import modelSource from '../../assets/models/vitiligo_detector.tflite';
import { resizeImageData } from '@/utils/imageProcessor';

export interface VitiligoDetectionResult {
  hasVitiligo: boolean;
  confidence: number;
  boundingBoxes?: {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    points?: { x: number; y: number }[];
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

  const detectVitiligo = async (imageData: ProcessedImage): Promise<VitiligoDetectionResult> => {
    try {
      if (tensorflowState.state !== 'loaded' || !tensorflowState.model) {
        throw new Error('Model not loaded');
      }

      const model: any = tensorflowState.model;
      // Attempt to read input tensor metadata from the model; fallback to 224x224x3
      const inputInfo = Array.isArray(model.inputs) && model.inputs.length > 0 ? model.inputs[0] : undefined;
      const outputInfo = Array.isArray(model.outputs) && model.outputs.length > 0 ? model.outputs[0] : undefined;

      const inputShape: number[] = inputInfo && Array.isArray(inputInfo.shape) ? inputInfo.shape : [1, 224, 224, 3];
      const inputDtype: string = inputInfo && inputInfo.type ? String(inputInfo.type) : 'float32';

      // Shapes are typically [1, H, W, C]
      const inputHeight = inputShape[1] ?? 224;
      const inputWidth = inputShape[2] ?? 224;
      const inputChannels = inputShape[3] ?? 3;

      if (inputChannels !== 3) {
        throw new Error(`Unsupported input channels: ${inputChannels}. Expected 3 (RGB).`);
      }

      // Resize to model's expected input size
      const resized: ProcessedImage = resizeImageData(imageData, inputWidth, inputHeight);

      // Build input tensor matching dtype; to mirror the Python example, do not normalize by default
      // If dtype is float32, provide Float32 values in 0..255 range (no /255) unless your training required it
      let inputTensor: Uint8Array | Float32Array;
      if (String(inputDtype).toLowerCase() === 'float32') {
        const floatInput = new Float32Array(inputWidth * inputHeight * 3);
        for (let i = 0; i < floatInput.length; i++) {
          floatInput[i] = resized.data[i];
        }
        inputTensor = floatInput;
      } else {
        // uint8 or others: pass raw bytes
        inputTensor = new Uint8Array(resized.data);
      }

      // Run inference (synchronously)
      const rawOutput = model.runSync([inputTensor]);

      // Interpret outputs deterministically
      const result = processModelOutput(rawOutput, outputInfo, inputWidth, inputHeight);
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
    model: tensorflowState.state === 'loaded' ? (tensorflowState.model as any) : null,
    status: tensorflowState.state,
    detectVitiligo,
    isModelReady: tensorflowState.state === 'loaded' && tensorflowState.model !== null,
  };
}

// Helper function to prepare input tensor
// Removed: old prepareInputTensor. Resizing now uses resizeImageData and dtype handling is inline above.

// Helper function to process model output
function processModelOutput(
  rawOutput: any,
  outputInfo: any,
  inputWidth: number,
  inputHeight: number,
): VitiligoDetectionResult {
  try {
    // react-native-fast-tflite typically returns an array of TypedArrays or numbers.
    // Assume first output is logits/scores with shape [1, numClasses] or [numClasses].
    const first = Array.isArray(rawOutput) ? rawOutput[0] : rawOutput;

    let scores: number[] = [];
    if (first instanceof Float32Array || first instanceof Uint8Array) {
      scores = Array.from(first as any);
    } else if (Array.isArray(first)) {
      scores = first as number[];
    } else if (typeof first === 'number') {
      scores = [first];
    }

    // If there is a batch dimension, strip it (common when output is [1, N])
    // Some runtimes may already flatten; we keep it simple here.

    if (scores.length === 0) {
      return {
        hasVitiligo: false,
        confidence: 0.0,
      };
    }

    if (scores.length === 1) {
      const prob = scores[0];
      return {
        hasVitiligo: prob >= 0.5,
        confidence: Math.max(0, Math.min(1, Number(prob))),
      };
    }

    let maxIndex = 0;
    let maxScore = scores[0];
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] > maxScore) {
        maxScore = scores[i];
        maxIndex = i;
      }
    }

    // Assume class index 1 corresponds to vitiligo (adjust if your model differs)
    const hasVitiligo = maxIndex === 1;
    return {
      hasVitiligo,
      confidence: Number(maxScore),
    };
  } catch (error) {
    console.error('Error processing model output:', error);
    return {
      hasVitiligo: false,
      confidence: 0.0,
    };
  }
}
