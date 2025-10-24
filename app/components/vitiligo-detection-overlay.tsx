import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { VitiligoDetectionResult } from '../services/vitiligoModel';

interface VitiligoDetectionOverlayProps {
  detectionResult: VitiligoDetectionResult;
  imageWidth: number;
  imageHeight: number;
  containerWidth: number;
  containerHeight: number;
  hideSummary?: boolean;
}

export default function VitiligoDetectionOverlay({
  detectionResult,
  imageWidth,
  imageHeight,
  containerWidth,
  containerHeight,
  hideSummary = false,
}: VitiligoDetectionOverlayProps) {
  // Calculate scaling factors to map detection coordinates to display coordinates
  const scaleX = containerWidth / imageWidth;
  const scaleY = containerHeight / imageHeight;

  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.8) return '#FF4444'; // High confidence - red
    if (confidence > 0.6) return '#FF8800'; // Medium confidence - orange
    if (confidence > 0.4) return '#FFAA00'; // Low confidence - yellow
    return '#888888'; // Very low confidence - gray
  };

  const getConfidenceText = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <View style={styles.overlay}>
      {/* Detection Status */}
      {!hideSummary && (
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: detectionResult.hasVitiligo ? '#FF4444' : '#00AA00' }]}>
            {detectionResult.hasVitiligo ? 'Vitiligo Detected' : 'No Vitiligo Detected'}
          </Text>
          <Text style={styles.confidenceText}>Confidence: {getConfidenceText(detectionResult.confidence)}</Text>
        </View>
      )}

      {/* Bounding Boxes */}
      {detectionResult.boundingBoxes &&
        detectionResult.boundingBoxes.map((box, index) => {
          // Clamp coordinates to image bounds
          const clampedX = Math.max(0, Math.min(box.x, imageWidth - box.width));
          const clampedY = Math.max(0, Math.min(box.y, imageHeight - box.height));
          const clampedWidth = Math.min(box.width, imageWidth - clampedX);
          const clampedHeight = Math.min(box.height, imageHeight - clampedY);

          const scaledX = clampedX * scaleX;
          const scaledY = clampedY * scaleY;
          const scaledWidth = clampedWidth * scaleX;
          const scaledHeight = clampedHeight * scaleY;

          // If the bounding box is invalid or too large, show a full-image overlay
          if (scaledWidth <= 0 || scaledHeight <= 0 || scaledWidth > containerWidth || scaledHeight > containerHeight) {
            return (
              <View
                key={`full-overlay-${index}`}
                style={[
                  styles.boundingBox,
                  {
                    left: 0,
                    top: 0,
                    width: containerWidth,
                    height: containerHeight,
                    borderColor: getConfidenceColor(box.confidence),
                    borderWidth: 3,
                  },
                ]}
              >
                <View style={[styles.confidenceLabel, { backgroundColor: getConfidenceColor(box.confidence) }]}>
                  <Text style={styles.confidenceLabelText}>{getConfidenceText(box.confidence)}</Text>
                </View>
              </View>
            );
          }

          const polygon = Array.isArray(box.points) && box.points.length >= 3 ? box.points : null;

          return (
            <View key={index}>
              {/* Bounding box frame */}
              <View
                style={[
                  styles.boundingBox,
                  {
                    left: scaledX,
                    top: scaledY,
                    width: scaledWidth,
                    height: scaledHeight,
                    borderColor: getConfidenceColor(box.confidence),
                  },
                ]}
              >
                <View style={[styles.confidenceLabel, { backgroundColor: getConfidenceColor(box.confidence) }]}>
                  <Text style={styles.confidenceLabelText}>{getConfidenceText(box.confidence)}</Text>
                </View>
              </View>

              {/* Polygon overlay if provided */}
              {polygon && (
                <Canvas
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: containerWidth,
                    height: containerHeight,
                    zIndex: 4,
                  }}
                >
                  {(() => {
                    const p = Skia.Path.Make();
                    polygon.forEach((pt, i) => {
                      const px = Math.max(0, Math.min(containerWidth, pt.x * scaleX));
                      const py = Math.max(0, Math.min(containerHeight, pt.y * scaleY));
                      if (i === 0) {
                        p.moveTo(px, py);
                      } else {
                        p.lineTo(px, py);
                      }
                    });
                    p.close();
                    return (
                      <>
                        <Path path={p} color={`${getConfidenceColor(box.confidence)}55`} style="fill" />
                        <Path path={p} color={getConfidenceColor(box.confidence)} strokeWidth={2} style="stroke" />
                      </>
                    );
                  })()}
                </Canvas>
              )}
            </View>
          );
        })}

      {/* Overlay Pattern for Detected Areas */}
      {detectionResult.hasVitiligo && (
        <View
          style={[
            styles.patternOverlay,
            {
              width: containerWidth,
              height: containerHeight,
            },
          ]}
        >
          {/* Add a subtle pattern overlay to highlight detected areas */}
          <View style={styles.patternLines} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none', // Allow touches to pass through
  },
  statusContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    zIndex: 5,
  },
  confidenceLabel: {
    position: 'absolute',
    top: -20,
    left: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  confidenceLabelText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  patternOverlay: {
    position: 'absolute',
    opacity: 0.1,
    zIndex: 1,
  },
  patternLines: {
    flex: 1,
    backgroundColor: 'transparent',
    // Add diagonal lines pattern
    borderWidth: 1,
    borderColor: '#FF4444',
    borderStyle: 'dashed',
  },
});
