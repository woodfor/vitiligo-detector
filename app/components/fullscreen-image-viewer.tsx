import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Modal, SafeAreaView } from 'react-native';
import { VitiligoDetectionResult } from '../services/vitiligoModel';
import VitiligoDetectionOverlay from './vitiligo-detection-overlay';

interface FullscreenImageViewerProps {
  visible: boolean;
  imageUri: string;
  detectionResult: VitiligoDetectionResult | null;
  imageDimensions: { width: number; height: number } | null;
  onClose: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FullscreenImageViewer({
  visible,
  imageUri,
  detectionResult,
  imageDimensions,
  onClose,
}: FullscreenImageViewerProps) {
  const [localImageDimensions, setLocalImageDimensions] = React.useState<{ width: number; height: number } | null>(
    null,
  );

  // Fallback: Get image dimensions using Image.getSize if not provided
  React.useEffect(() => {
    if (visible && imageUri && !imageDimensions && !localImageDimensions) {
      Image.getSize(
        imageUri,
        (width, height) => {
          setLocalImageDimensions({ width, height });
        },
        (error) => {
          console.error('Error getting image size:', error);
        },
      );
    }
  }, [visible, imageUri, imageDimensions, localImageDimensions]);

  // Use local dimensions if available, otherwise fall back to passed dimensions
  const effectiveDimensions = localImageDimensions || imageDimensions;

  if (!visible || !imageUri) {
    return null;
  }

  // Show loading state if dimensions aren't available yet
  if (!effectiveDimensions) {
    return (
      <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Vitiligo Detection Results</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.imageContainer}>
            <Text style={styles.loadingText}>Loading image...</Text>
            <Text style={styles.loadingText}>Image URI: {imageUri}</Text>
            <Text style={styles.loadingText}>
              Dimensions: {imageDimensions ? `${imageDimensions.width}x${imageDimensions.height}` : 'null'}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }
  // Calculate display dimensions to fit the screen while maintaining aspect ratio
  const imageAspectRatio = effectiveDimensions.width / effectiveDimensions.height;
  const screenAspectRatio = screenWidth / screenHeight;

  let displayWidth: number;
  let displayHeight: number;
  let imageStyle: any;

  if (imageAspectRatio > screenAspectRatio) {
    // Image is wider than screen - fit to width
    displayWidth = screenWidth;
    displayHeight = screenWidth / imageAspectRatio;
    imageStyle = {
      width: displayWidth,
      height: displayHeight,
    };
  } else {
    // Image is taller than screen - fit to height
    displayHeight = screenHeight;
    displayWidth = screenHeight * imageAspectRatio;
    imageStyle = {
      width: displayWidth,
      height: displayHeight,
    };
  }

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
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Vitiligo Detection Results</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          <View style={[styles.imageWrapper, { width: displayWidth, height: displayHeight }]}>
            <Image
              source={{ uri: imageUri }}
              style={imageStyle}
              resizeMode="contain"
              onLoad={(event) => {
                const { width, height } = event.nativeEvent.source;
                setLocalImageDimensions({ width, height });
              }}
            />
            {detectionResult && (
              <VitiligoDetectionOverlay
                hideSummary={true}
                detectionResult={detectionResult}
                imageWidth={effectiveDimensions.width}
                imageHeight={effectiveDimensions.height}
                containerWidth={displayWidth}
                containerHeight={displayHeight}
              />
            )}
          </View>
        </View>

        {/* Detection Summary */}
        {detectionResult && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <Text style={[styles.detectionStatus, { color: detectionResult.hasVitiligo ? '#FF4444' : '#00AA00' }]}>
                {detectionResult.hasVitiligo ? 'Vitiligo Detected' : 'No Vitiligo Detected'}
              </Text>
              <Text style={styles.overallConfidence}>
                Overall Confidence: {getConfidenceText(detectionResult.confidence)}
              </Text>
            </View>

            {detectionResult.boundingBoxes && detectionResult.boundingBoxes.length > 0 && (
              <View style={styles.detectionsList}>
                <Text style={styles.detectionsTitle}>Detected Areas ({detectionResult.boundingBoxes.length}):</Text>
                {detectionResult.boundingBoxes.map((box, index) => (
                  <View key={index} style={styles.detectionItem}>
                    <View
                      style={[styles.confidenceIndicator, { backgroundColor: getConfidenceColor(box.confidence) }]}
                    />
                    <Text style={styles.detectionText}>
                      Area {index + 1}: {getConfidenceText(box.confidence)} confidence
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  imageWrapper: {
    position: 'relative',
  },
  summaryContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  detectionStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  overallConfidence: {
    color: 'white',
    fontSize: 16,
  },
  detectionsList: {
    marginTop: 10,
  },
  detectionsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  detectionText: {
    color: 'white',
    fontSize: 14,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});
