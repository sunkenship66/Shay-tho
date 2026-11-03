export const getTileDistance = (a, b) => {
  const dRow = a.row - b.row;
  const dCol = a.col - b.col;
  return Math.sqrt(dRow * dRow + dCol * dCol);
};

// a and b are { row, col }
export const isWithinProximity = (a, b, threshold = 3) => getTileDistance(a, b) <= threshold;
