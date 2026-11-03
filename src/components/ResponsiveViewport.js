import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { MAP_COLS, MAP_ROWS } from '../constants/gameConfig';

const ASPECT_RATIO = MAP_COLS / MAP_ROWS; // 1.2

// Fits the 12x10 map inside its parent (the top ~45% of the screen).
// children is a function: (tileSize) => ReactNode
export default function ResponsiveViewport({ children }) {
  const { width, height } = useWindowDimensions();

  const maxWidth = width - 16;
  const maxHeight = height * 0.45 - 16;

  let mapWidth = maxWidth;
  let mapHeight = mapWidth / ASPECT_RATIO;
  if (mapHeight > maxHeight) {
    mapHeight = maxHeight;
    mapWidth = mapHeight * ASPECT_RATIO;
  }

  // Whole pixels keep the pixel art crisp
  const tileSize = Math.floor(mapWidth / MAP_COLS);
  const w = tileSize * MAP_COLS;
  const h = tileSize * MAP_ROWS;

  return (
    <View style={styles.topContainer}>
      <View style={[styles.canvas, { width: w, height: h }]}>{children(tileSize)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  topContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' },
  canvas: { overflow: 'hidden', position: 'relative', borderRadius: 4, borderWidth: 2, borderColor: '#2d3748' },
});
