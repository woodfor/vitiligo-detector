import * as FileSystem from 'expo-file-system/legacy';
import { File, Paths } from 'expo-file-system/next';

export interface CloudPredictionBox {
  x: number; // center-x in pixels
  y: number; // center-y in pixels
  width: number; // width in pixels
  height: number; // height in pixels
  confidence: number; // 0..1
}

export interface CloudResponse {
  image?: { width?: number; height?: number };
  predictions?: CloudPredictionBox[];
  [key: string]: any;
}

export async function uploadSavedImageToCloudModel(apiKey: string): Promise<CloudResponse> {
  // Always read from the canonical saved path to avoid cache-busting query params in state
  const permanentFile = new File(Paths.document, 'vitiligo-saved-frame.jpg');

  if (!permanentFile.exists) {
    throw new Error('Saved image not found');
  }

  // Read file as base64 using classic API for compatibility
  const base64 = await FileSystem.readAsStringAsync(permanentFile.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const url = 'https://serverless.roboflow.com/vit-tracker-xcsg7/2?api_key=' + encodeURIComponent(apiKey);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: base64,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloud model error: ${response.status} ${text}`);
  }

  const json = (await response.json()) as CloudResponse;
  return json;
}
