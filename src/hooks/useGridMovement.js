import { useState, useRef, useCallback, useEffect } from 'react';
import { canMoveToTile } from '../utils/layerRules';
import { STEP_DELAY_MS } from '../constants/gameConfig';

const DIRS = {
  UP: { dRow: -1, dCol: 0, facing: 'up' },
  DOWN: { dRow: 1, dCol: 0, facing: 'down' },
  LEFT: { dRow: 0, dCol: -1, facing: 'left' },
  RIGHT: { dRow: 0, dCol: 1, facing: 'right' },
};

export default function useGridMovement({ initialPosition, others = [] }) {
  const [position, setPosition] = useState(initialPosition);
  const [direction, setDirection] = useState('down');
  const posRef = useRef(initialPosition);
  const othersRef = useRef(others);
  const lastStepRef = useRef(0);

  useEffect(() => {
    othersRef.current = others;
  }, [others]);

  const move = useCallback((dir) => {
    const d = DIRS[dir];
    if (!d) return;
    setDirection(d.facing);

    const now = Date.now();
    if (now - lastStepRef.current < STEP_DELAY_MS) return;

    const next = { row: posRef.current.row + d.dRow, col: posRef.current.col + d.dCol };
    if (canMoveToTile(next.row, next.col, othersRef.current)) {
      lastStepRef.current = now;
      posRef.current = next;
      setPosition(next);
    }
  }, []);

  return { position, direction, move };
}
