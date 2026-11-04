export const getTileDistance = (a, b) => {
  const dRow = a.row - b.row;
  const dCol = a.col - b.col;
  return Math.sqrt(dRow * dRow + dCol * dCol);
};

// a and b are { row, col }
export const isWithinProximity = (a, b, threshold = 3) => getTileDistance(a, b) <= threshold;

const FACING = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };

// The player standing on the tile directly in front of me (or null)
export const getFacingTarget = (position, direction, players) => {
  const d = FACING[direction];
  if (!d) return null;
  const row = position.row + d[0];
  const col = position.col + d[1];
  return players.find((p) => p.row === row && p.col === col) || null;
};
