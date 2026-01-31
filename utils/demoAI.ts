import { Board, cloneBoard, swapBlocks, canSwap } from './boardUtils';
import { findMatches } from './matchDetection';
import { GRID_SIZE } from './constants';

export type Move = {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  score: number;
};

// Check if a position has an obstacle nearby that could be damaged
const hasAdjacentObstacle = (board: Board, row: number, col: number): boolean => {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
      const block = board[nr][nc];
      if (block.obstacle && block.obstacle.type !== 'blocker') {
        return true;
      }
    }
  }
  return false;
};

// Count obstacles that would be affected by a match at these positions
const countAffectedObstacles = (board: Board, positions: { row: number; col: number }[]): number => {
  const affectedPositions = new Set<string>();

  for (const { row, col } of positions) {
    // Check the block itself
    if (board[row][col].obstacle) {
      affectedPositions.add(`${row}-${col}`);
    }
    // Check adjacent for ice
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
        const adjacentBlock = board[nr][nc];
        if (adjacentBlock.obstacle?.type === 'ice') {
          affectedPositions.add(`${nr}-${nc}`);
        }
      }
    }
  }

  return affectedPositions.size;
};

// Find all valid moves that would create a match
export const findAllValidMoves = (board: Board): Move[] => {
  const validMoves: Move[] = [];

  // Check all horizontal adjacent pairs
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE - 1; col++) {
      // Skip if either block can't be swapped (blocker)
      if (!canSwap(board[row][col]) || !canSwap(board[row][col + 1])) continue;

      const move = evaluateMove(board, row, col, row, col + 1);
      if (move) validMoves.push(move);
    }
  }

  // Check all vertical adjacent pairs
  for (let row = 0; row < GRID_SIZE - 1; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      // Skip if either block can't be swapped (blocker)
      if (!canSwap(board[row][col]) || !canSwap(board[row + 1][col])) continue;

      const move = evaluateMove(board, row, col, row + 1, col);
      if (move) validMoves.push(move);
    }
  }

  return validMoves;
};

// Check if a type is a special power-up
const isSpecialType = (type: string | null) =>
  type === 'rocket-h' || type === 'rocket-v' || type === 'rainbow' || type === 'bomb' || type === 'propeller';

// Evaluate a potential swap and return a scored move if valid
const evaluateMove = (
  board: Board,
  row1: number,
  col1: number,
  row2: number,
  col2: number
): Move | null => {
  const block1 = board[row1][col1];
  const block2 = board[row2][col2];

  // Special case: swapping two special blocks is ALWAYS valid (creates combo!)
  const isTwoSpecials = isSpecialType(block1.specialType) && isSpecialType(block2.specialType);

  // Simulate the swap
  const testBoard = swapBlocks(cloneBoard(board), row1, col1, row2, col2);
  const matchResult = findMatches(testBoard);

  // Move is valid if it creates matches OR if it's a combo swap
  if (matchResult.matches.length === 0 && !isTwoSpecials) {
    return null;
  }

  // Calculate score for this move
  let score = 0;

  for (const match of matchResult.matches) {
    // Base points per block
    score += match.blocks.length * 10;

    // Bonus for 4+ matches (creates rockets)
    if (match.blocks.length >= 4) {
      score += 30;
    }

    // Bonus for 5+ matches
    if (match.blocks.length >= 5) {
      score += 20;
    }
  }

  // Bonus for triggering rockets
  score += matchResult.rocketActivations.length * 50;

  // Bonus for creating rockets
  score += matchResult.rocketCreations.length * 40;

  // Bonus for triggering rainbows (very powerful!)
  score += matchResult.rainbowActivations.length * 100;

  // Bonus for creating rainbows
  score += matchResult.rainbowCreations.length * 60;

  // Small bonus if one of the swapped blocks has a special type
  if (block1.specialType || block2.specialType) {
    score += 25;
  }

  // Extra bonus for rainbow blocks
  if (block1.specialType === 'rainbow' || block2.specialType === 'rainbow') {
    score += 50;
  }

  // Bonus for bomb activations
  score += matchResult.bombActivations.length * 75;

  // Extra bonus for bomb blocks
  if (block1.specialType === 'bomb' || block2.specialType === 'bomb') {
    score += 40;
  }

  // Bonus for propeller activations
  score += matchResult.propellerActivations.length * 60;

  // Extra bonus for propeller blocks
  if (block1.specialType === 'propeller' || block2.specialType === 'propeller') {
    score += 35;
  }

  // Bonus for damaging obstacles
  const allMatchedPositions: { row: number; col: number }[] = [];
  for (const match of matchResult.matches) {
    allMatchedPositions.push(...match.blocks);
  }
  const obstaclesAffected = countAffectedObstacles(board, allMatchedPositions);
  score += obstaclesAffected * 45; // Nice bonus for obstacle damage

  // Extra bonus if the match result indicates obstacle damage
  if (matchResult.obstacleDamage && matchResult.obstacleDamage.length > 0) {
    score += matchResult.obstacleDamage.length * 30;
    // Extra for destroyed obstacles
    const destroyed = matchResult.obstacleDamage.filter(d => d.destroyed).length;
    score += destroyed * 50;
  }

  // MASSIVE bonus for swapping two special blocks together (creates powerful combos!)
  const isRocket = (type: typeof block1.specialType) =>
    type === 'rocket-h' || type === 'rocket-v';

  if (isSpecialType(block1.specialType) && isSpecialType(block2.specialType)) {
    // Base combo bonus
    score += 300;

    // Rainbow + Rainbow = clears entire board! Highest priority
    if (block1.specialType === 'rainbow' && block2.specialType === 'rainbow') {
      score += 500;
    }
    // Rainbow + anything = very powerful
    else if (block1.specialType === 'rainbow' || block2.specialType === 'rainbow') {
      score += 250;
    }
    // Bomb + Bomb = 5x5 explosion
    else if (block1.specialType === 'bomb' && block2.specialType === 'bomb') {
      score += 200;
    }
    // Rocket + Bomb = 3 rows/columns
    else if ((isRocket(block1.specialType) && block2.specialType === 'bomb') ||
             (block1.specialType === 'bomb' && isRocket(block2.specialType))) {
      score += 180;
    }
    // Rocket + Rocket = giant cross
    else if (isRocket(block1.specialType) && isRocket(block2.specialType)) {
      score += 150;
    }
  }

  return {
    fromRow: row1,
    fromCol: col1,
    toRow: row2,
    toCol: col2,
    score,
  };
};

// Select a move: 80% best move, 20% random valid move
export const selectMove = (moves: Move[]): Move | null => {
  if (moves.length === 0) return null;

  // Sort by score descending
  const sortedMoves = [...moves].sort((a, b) => b.score - a.score);

  // 80% chance to pick best move, 20% chance for random
  if (Math.random() < 0.8) {
    return sortedMoves[0];
  } else {
    // Pick a random move
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }
};

// Main function to get the next demo move
export const getDemoMove = (board: Board): Move | null => {
  const validMoves = findAllValidMoves(board);
  return selectMove(validMoves);
};
