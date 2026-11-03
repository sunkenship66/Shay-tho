import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import mapData from '../../assets/map/map_2.json';
import { TILE_ASSETS } from '../constants/roomAssets';
import { BASE_TILE_PX } from '../constants/gameConfig';

// Native image size per gid, read from the embedded tilesets (some are 64x32, 31x58, 96x30, 64x64).
const TILE_SIZES = {};
mapData.tilesets.forEach((ts) => {
  TILE_SIZES[ts.firstgid] = { w: ts.imagewidth, h: ts.imageheight };
});

// Depth ordering inside the canvas. Avatars use AVATAR_Z(row) so they sort against furniture.
const LAYER_Z = { floor: 0, rug: 1, wall: 2 };
const FURNITURE_Z = (row) => 10 + row * 2;
export const AVATAR_Z = (row) => 11 + row * 2;

// The static map. Memoized so it is NOT re-drawn every time a player moves.
const Tiles = React.memo(function Tiles({ tileSize }) {
  const cols = mapData.width;

  const tiles = useMemo(() => {
    const out = [];
    mapData.layers.forEach((layer) => {
      if (layer.type !== 'tilelayer') return;
      layer.data.forEach((gid, index) => {
        if (gid === 0) return;
        const row = Math.floor(index / cols);
        const col = index % cols;
        const size = TILE_SIZES[gid] || { w: BASE_TILE_PX, h: BASE_TILE_PX };
        const width = (size.w / BASE_TILE_PX) * tileSize;
        const height = (size.h / BASE_TILE_PX) * tileSize;
        out.push({
          key: `${layer.name}-${index}`,
          gid,
          left: col * tileSize,
          // Tiled anchors oversized tiles at the bottom-left of their cell
          top: (row + 1) * tileSize - height,
          width,
          height,
          zIndex: layer.name === 'furnitures' ? FURNITURE_Z(row) : LAYER_Z[layer.name] ?? 0,
        });
      });
    });
    return out;
  }, [tileSize, cols]);

  return (
    <>
      {tiles.map((t) => (
        <Image
          key={t.key}
          source={TILE_ASSETS[t.gid]}
          resizeMode="stretch"
          resizeMethod="scale"
          style={{ position: 'absolute', left: t.left, top: t.top, width: t.width, height: t.height, zIndex: t.zIndex }}
        />
      ))}
    </>
  );
});

export default function TileMap({ tileSize, children }) {
  return (
    <View style={{ width: mapData.width * tileSize, height: mapData.height * tileSize, backgroundColor: '#000' }}>
      <Tiles tileSize={tileSize} />
      {children}
    </View>
  );
}