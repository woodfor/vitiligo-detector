// Heuristic heatmap analyzer following test_weight.py style (bright-area contours)
// Requires react-native-fast-opencv. API names may vary slightly; adjust if needed.

export interface RectBox {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

export interface HeatmapResult {
  rects: RectBox[];
}

// Threshold defaults to 180 as in test_weight.py
export async function analyzeBrightAreas(imageUri: string, threshold: number = 180): Promise<HeatmapResult> {
  try {
    // Lazy import to avoid initializing native module until needed
    const cvModule: any = require('react-native-fast-opencv');
    const cv = cvModule?.cv ?? cvModule;

    if (!cv) {
      throw new Error('OpenCV module not available');
    }

    // Read image from URI
    const src = await cv.imread(imageUri);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_BGR2GRAY);

    const mask = new cv.Mat();
    cv.threshold(gray, mask, threshold, 255, cv.THRESH_BINARY);

    const contours: any[] = new cvModule.Contours();
    const hierarchy = new cv.Mat();
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Sort by area (desc) and collect boxes
    const rects: RectBox[] = [];
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > 30) {
        const rect = cv.boundingRect(contour);
        rects.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, area });
      }
      contour.delete?.();
    }

    rects.sort((a, b) => b.area - a.area);

    // Cleanup
    src.delete?.();
    gray.delete?.();
    mask.delete?.();
    hierarchy.delete?.();
    contours.delete?.();

    return { rects };
  } catch (e) {
    console.error('analyzeBrightAreas error:', e);
    return { rects: [] };
  }
}


