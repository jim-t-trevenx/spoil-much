import { GRID_SIZE, COLORS, getRandomColor } from './constants';

export type SpecialType = 'rocket-h' | 'rocket-v' | 'bomb' | 'propeller' | 'rainbow' | null;

export type Difficulty = 'easy' | 'medium';

// Obstacle types
export type ObstacleType = 'box' | 'ice' | 'chain' | 'blocker' | 'grass';

export type Obstacle = {
  type: ObstacleType;
  health: number; // Hits remaining (boxes: 1-3, others: 1)
};

export type Block = {
  id: string;
  color: string;
  row: number;
  col: number;
  specialType: SpecialType;
  obstacle?: Obstacle | null;
};

export type Board = Block[][];

// Obstacle configuration
export type ObstacleConfig = {
  type: ObstacleType;
  row: number;
  col: number;
  health?: number;
};

const ROCKET_COUNTS: Record<Difficulty, number> = {
  easy: 4,
  medium: 0,
};

const PROPELLER_COUNTS: Record<Difficulty, number> = {
  easy: 2,
  medium: 0,
};

export const createInitialBoard = (difficulty: Difficulty = 'medium'): Board => {
  const board: Board = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    const rowBlocks: Block[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      let color = getRandomColor();

      // Avoid initial matches of 3 horizontally
      while (
        col >= 2 &&
        rowBlocks[col - 1].color === color &&
        rowBlocks[col - 2].color === color
      ) {
        color = getRandomColor();
      }

      // Avoid initial matches of 3 vertically
      while (
        row >= 2 &&
        board[row - 1][col].color === color &&
        board[row - 2][col].color === color
      ) {
        color = getRandomColor();
      }

      rowBlocks.push({
        id: `${row}-${col}-${Date.now()}-${Math.random()}`,
        color,
        row,
        col,
        specialType: null,
      });
    }
    board.push(rowBlocks);
  }

  // Add rockets for easy mode
  const rocketCount = ROCKET_COUNTS[difficulty];
  const usedPositions: { row: number; col: number }[] = [];

  if (rocketCount > 0) {
    while (usedPositions.length < rocketCount) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      const exists = usedPositions.some(p => p.row === row && p.col === col);
      if (!exists) {
        usedPositions.push({ row, col });
        const rocketType = Math.random() > 0.5 ? 'rocket-h' : 'rocket-v';
        board[row][col].specialType = rocketType;
      }
    }
  }

  // Add propellers for easy mode
  const propellerCount = PROPELLER_COUNTS[difficulty];
  if (propellerCount > 0) {
    let added = 0;
    while (added < propellerCount) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      const exists = usedPositions.some(p => p.row === row && p.col === col);
      if (!exists) {
        usedPositions.push({ row, col });
        board[row][col].specialType = 'propeller';
        added++;
      }
    }
  }

  return board;
};

export const cloneBoard = (board: Board): Board => {
  return board.map(row => row.map(block => ({
    ...block,
    obstacle: block.obstacle ? { ...block.obstacle } : null,
  })));
};

export const swapBlocks = (
  board: Board,
  row1: number,
  col1: number,
  row2: number,
  col2: number
): Board => {
  const newBoard = cloneBoard(board);
  const temp = { ...newBoard[row1][col1] };

  newBoard[row1][col1] = {
    ...newBoard[row2][col2],
    row: row1,
    col: col1,
  };
  newBoard[row2][col2] = {
    ...temp,
    row: row2,
    col: col2,
  };

  // Update IDs to trigger re-render
  newBoard[row1][col1].id = `${row1}-${col1}-${Date.now()}-${Math.random()}`;
  newBoard[row2][col2].id = `${row2}-${col2}-${Date.now()}-${Math.random()}`;

  return newBoard;
};

export const areAdjacent = (
  row1: number,
  col1: number,
  row2: number,
  col2: number
): boolean => {
  const rowDiff = Math.abs(row1 - row2);
  const colDiff = Math.abs(col1 - col2);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

// Create a board with obstacles from config
export const createBoardWithObstacles = (
  difficulty: Difficulty,
  obstacles: ObstacleConfig[]
): Board => {
  const board = createInitialBoard(difficulty);

  for (const config of obstacles) {
    const { type, row, col, health } = config;
    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      // Default health based on obstacle type
      const defaultHealth = type === 'box' ? (health ?? 2) : 1;

      board[row][col].obstacle = {
        type,
        health: health ?? defaultHealth,
      };

      // Blockers have no color (can't be matched)
      if (type === 'blocker') {
        board[row][col].color = '';
      }
    }
  }

  return board;
};

// Check if a block can be swapped (not a blocker)
export const canSwap = (block: Block): boolean => {
  if (!block.color) return false;
  if (block.obstacle?.type === 'blocker') return false;
  return true;
};

// Check if a block can be matched (has color and not blocked)
export const canMatch = (block: Block): boolean => {
  if (!block.color) return false;
  if (block.obstacle?.type === 'blocker') return false;
  return true;
};

// Damage an obstacle, returns true if destroyed
export const damageObstacle = (block: Block): boolean => {
  if (!block.obstacle) return false;

  block.obstacle.health -= 1;

  if (block.obstacle.health <= 0) {
    block.obstacle = null;
    return true;
  }

  return false;
};

// Get default health for obstacle type
export const getObstacleDefaultHealth = (type: ObstacleType): number => {
  switch (type) {
    case 'box':
      return 2; // 2 hits by default
    case 'ice':
    case 'chain':
    case 'grass':
      return 1;
    case 'blocker':
      return 999; // Effectively indestructible
    default:
      return 1;
  }
};
