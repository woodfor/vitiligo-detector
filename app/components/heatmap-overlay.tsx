import React from 'react';
import { Canvas, Rect, Group, LinearGradient, vec } from '@shopify/react-native-skia';

export interface HeatmapRect {
  x: number;
  y: number;
  width: number;
  height: number;
  area?: number;
}

interface HeatmapOverlayProps {
  rects: HeatmapRect[];
  imageWidth: number;
  imageHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export default function HeatmapOverlay({
  rects,
  imageWidth,
  imageHeight,
  containerWidth,
  containerHeight,
}: HeatmapOverlayProps) {
  const scaleX = containerWidth / Math.max(1, imageWidth);
  const scaleY = containerHeight / Math.max(1, imageHeight);

  return (
    <Canvas style={{ width: containerWidth, height: containerHeight }}>
      <Group>
        {rects.map((r, idx) => {
          const left = r.x * scaleX;
          const top = r.y * scaleY;
          const width = Math.max(1, r.width * scaleX);
          const height = Math.max(1, r.height * scaleY);
          const start = vec(left, top);
          const end = vec(left + width, top + height);
          // Red/orange gradient for emphasis
          const colors = ['rgba(255,0,0,0.35)', 'rgba(255,140,0,0.15)'];
          return (
            <Group key={idx}>
              <Rect x={left} y={top} width={width} height={height} color="rgba(255,0,0,0.15)" />
              <LinearGradient start={start} end={end} colors={colors} />
            </Group>
          );
        })}
      </Group>
    </Canvas>
  );
}
