export const GRID_COLUMNS = 13;
export const GRID_ROWS = 8;
export const CELL_SIZE = 58;
export const GRID_PATH = [
  { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 },
  { x: 3, y: 2 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
  { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 },
  { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 },
  { x: 9, y: 4 }, { x: 9, y: 3 }, { x: 9, y: 2 }, { x: 10, y: 2 },
  { x: 11, y: 2 }, { x: 12, y: 2 },
] as const;

const pathKeys = new Set(GRID_PATH.map((point) => `${point.x},${point.y}`));

export function isPathCell(x: number, y: number): boolean { return pathKeys.has(`${x},${y}`); }

export function canPlaceTower(x: number, y: number, occupied: Array<{ x: number; y: number }>): boolean {
  return Number.isInteger(x) && Number.isInteger(y)
    && x >= 0 && x < GRID_COLUMNS && y >= 0 && y < GRID_ROWS
    && !isPathCell(x, y)
    && !occupied.some((point) => point.x === x && point.y === y);
}
