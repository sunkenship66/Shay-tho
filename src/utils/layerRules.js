import mapData from '../../assets/map/map_2.json';

const MAP_COLS = mapData.width;   // 12
const MAP_ROWS = mapData.height;  // 10

const layer = (name) => mapData.layers.find((l) => l.name === name)?.data ?? [];
const FLOOR = layer('floor');
const RUG = layer('rug');
const WALL = layer('wall');
const FURNITURE = layer('furnitures');

const inBounds = (row, col) => row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS;

/**
 * Walkable = has floor, no wall, no furniture, and not occupied by another player.
 * otherPlayers: array of { row, col }
 */
export const canMoveToTile = (row, col, otherPlayers = []) => {
  if (!inBounds(row, col)) return false;
  const i = row * MAP_COLS + col;
  if (FLOOR[i] === 0) return false;
  if (WALL[i] !== 0 || FURNITURE[i] !== 0) return false;
  return !otherPlayers.some((p) => p.row === row && p.col === col);
};

/** Placement rules (for a future room-decorating feature). */
export const canPlaceItem = (row, col, category) => {
  if (!inBounds(row, col)) return false;
  const i = row * MAP_COLS + col;
  if (category === 'rug') return RUG[i] === 0;
  if (category === 'furniture') return FURNITURE[i] === 0;
  return false;
};

/** Pick a random free walkable tile for spawning. */
export const getRandomSpawn = (occupied = []) => {
  const free = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (canMoveToTile(r, c, occupied)) free.push({ row: r, col: c });
    }
  }
  return free.length ? free[Math.floor(Math.random() * free.length)] : { row: 8, col: 5 };
};
