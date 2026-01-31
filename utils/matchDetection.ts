import { Board, Block, cloneBoard, SpecialType, ObstacleType, canMatch } from './boardUtils';
import { GRID_SIZE, getRandomColor } from './constants';

export type Match = {
  blocks: { row: number; col: number }[];
  direction: 'horizontal' | 'vertical';
};

// Obstacle damage tracking
export type ObstacleDamage = {
  row: number;
  col: number;
  type: ObstacleType;
  destroyed: boolean;
};

export type MatchResult = {
  matches: Match[];
  rocketCreations: { row: number; col: number; type: 'rocket-h' | 'rocket-v' }[];
  rocketActivations: { row: number; col: number; type: 'rocket-h' | 'rocket-v' }[];
  rainbowCreations: { row: number; col: number; color: string }[];
  rainbowActivations: { row: number; col: number; targetColor: string }[];
  bombCreations: { row: number; col: number; color: string }[];
  bombActivations: { row: number; col: number }[];
  propellerActivations: { row: number; col: number; targetRow: number; targetCol: number }[];
  obstacleDamage: ObstacleDamage[];
};

export const findMatches = (board: Board): MatchResult => {
  const matches: Match[] = [];
  const matched = new Set<string>();
  const rocketCreations: { row: number; col: number; type: 'rocket-h' | 'rocket-v' }[] = [];
  const rocketActivations: { row: number; col: number; type: 'rocket-h' | 'rocket-v' }[] = [];
  const rainbowCreations: { row: number; col: number; color: string }[] = [];
  const rainbowActivations: { row: number; col: number; targetColor: string }[] = [];
  const bombCreations: { row: number; col: number; color: string }[] = [];
  const bombActivations: { row: number; col: number }[] = [];
  const propellerActivations: { row: number; col: number; targetRow: number; targetCol: number }[] = [];
  const obstacleDamage: ObstacleDamage[] = [];
  const damagedObstacles = new Set<string>();

  // Helper to check if a block can participate in matches
  const canBlockMatch = (r: number, c: number): boolean => {
    const block = board[r]?.[c];
    if (!block || !block.color) return false;
    if (block.obstacle?.type === 'blocker') return false;
    return true;
  };

  // Track horizontal and vertical matches separately for L/T detection
  const horizontalMatches: Match[] = [];
  const verticalMatches: Match[] = [];

  // Find horizontal matches
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE - 2; col++) {
      // Skip if block can't match
      if (!canBlockMatch(row, col)) continue;

      const color = board[row][col].color;
      if (!color) continue;

      // Check if adjacent blocks can match and have same color
      if (
        canBlockMatch(row, col + 1) &&
        canBlockMatch(row, col + 2) &&
        board[row][col + 1].color === color &&
        board[row][col + 2].color === color
      ) {
        const match: Match = { blocks: [], direction: 'horizontal' };
        let endCol = col;

        while (endCol < GRID_SIZE && canBlockMatch(row, endCol) && board[row][endCol].color === color) {
          const key = `${row}-${endCol}`;
          if (!matched.has(key)) {
            match.blocks.push({ row, col: endCol });
            matched.add(key);

            // Check if this block is a special type
            const block = board[row][endCol];
            if (block.specialType === 'rocket-h' || block.specialType === 'rocket-v') {
              rocketActivations.push({
                row,
                col: endCol,
                type: block.specialType,
              });
            } else if (block.specialType === 'rainbow') {
              // Rainbow matches with any color - clear all of that color
              rainbowActivations.push({
                row,
                col: endCol,
                targetColor: color,
              });
            } else if (block.specialType === 'bomb') {
              // Bomb explodes in 3x3 area
              bombActivations.push({
                row,
                col: endCol,
              });
            } else if (block.specialType === 'propeller') {
              // Propeller will be handled after we know all matched positions
              // Mark for later processing
            }

            // Track obstacle damage for matched blocks
            if (block.obstacle && block.obstacle.type !== 'blocker') {
              const obstacleKey = `${row}-${endCol}`;
              if (!damagedObstacles.has(obstacleKey)) {
                damagedObstacles.add(obstacleKey);
                const destroyed = block.obstacle.health <= 1;
                obstacleDamage.push({
                  row,
                  col: endCol,
                  type: block.obstacle.type,
                  destroyed,
                });
              }
            }
          }
          endCol++;
        }

        if (match.blocks.length >= 3) {
          matches.push(match);
          horizontalMatches.push(match);
        }
        col = endCol - 1;
      }
    }
  }

  // Find vertical matches
  for (let col = 0; col < GRID_SIZE; col++) {
    for (let row = 0; row < GRID_SIZE - 2; row++) {
      // Skip if block can't match
      if (!canBlockMatch(row, col)) continue;

      const color = board[row][col].color;
      if (!color) continue;

      // Check if adjacent blocks can match and have same color
      if (
        canBlockMatch(row + 1, col) &&
        canBlockMatch(row + 2, col) &&
        board[row + 1][col].color === color &&
        board[row + 2][col].color === color
      ) {
        const match: Match = { blocks: [], direction: 'vertical' };
        let endRow = row;

        while (endRow < GRID_SIZE && canBlockMatch(endRow, col) && board[endRow][col].color === color) {
          const key = `${endRow}-${col}`;
          if (!matched.has(key)) {
            match.blocks.push({ row: endRow, col });
            matched.add(key);

            // Check if this block is a special type
            const block = board[endRow][col];
            if (block.specialType === 'rocket-h' || block.specialType === 'rocket-v') {
              rocketActivations.push({
                row: endRow,
                col,
                type: block.specialType,
              });
            } else if (block.specialType === 'rainbow') {
              rainbowActivations.push({
                row: endRow,
                col,
                targetColor: color,
              });
            } else if (block.specialType === 'bomb') {
              bombActivations.push({
                row: endRow,
                col,
              });
            } else if (block.specialType === 'propeller') {
              // Propeller will be handled after we know all matched positions
            }

            // Track obstacle damage for matched blocks
            if (block.obstacle && block.obstacle.type !== 'blocker') {
              const obstacleKey = `${endRow}-${col}`;
              if (!damagedObstacles.has(obstacleKey)) {
                damagedObstacles.add(obstacleKey);
                const destroyed = block.obstacle.health <= 1;
                obstacleDamage.push({
                  row: endRow,
                  col,
                  type: block.obstacle.type,
                  destroyed,
                });
              }
            }
          }
          endRow++;
        }

        if (match.blocks.length >= 3) {
          matches.push(match);
          verticalMatches.push(match);
        }
        row = endRow - 1;
      }
    }
  }

  // Build a set of all positions that will be cleared by current explosions
  const willBeCleared = new Set<string>();

  // Add all matched positions
  for (const match of matches) {
    for (const { row, col } of match.blocks) {
      willBeCleared.add(`${row}-${col}`);
    }
  }

  // Add positions cleared by rockets
  for (const rocket of rocketActivations) {
    if (rocket.type === 'rocket-h') {
      for (let c = 0; c < GRID_SIZE; c++) {
        willBeCleared.add(`${rocket.row}-${c}`);
      }
    } else {
      for (let r = 0; r < GRID_SIZE; r++) {
        willBeCleared.add(`${r}-${rocket.col}`);
      }
    }
  }

  // Add positions cleared by rainbows
  for (const rainbow of rainbowActivations) {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c].color === rainbow.targetColor) {
          willBeCleared.add(`${r}-${c}`);
        }
      }
    }
  }

  // Add positions cleared by bombs (3x3)
  for (const bomb of bombActivations) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = bomb.row + dr;
        const c = bomb.col + dc;
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          willBeCleared.add(`${r}-${c}`);
        }
      }
    }
  }

  // Process propellers - find targets that WON'T be destroyed
  for (const match of matches) {
    for (const { row, col } of match.blocks) {
      const block = board[row][col];
      if (block.specialType === 'propeller') {
        let targetRow = -1;
        let targetCol = -1;

        // Priority 1: Special blocks that won't be cleared
        const specialTargets: { row: number; col: number; priority: number }[] = [];
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const key = `${r}-${c}`;
            if (willBeCleared.has(key)) continue; // Skip positions being cleared

            const targetBlock = board[r][c];
            if (targetBlock.specialType && targetBlock.specialType !== 'propeller') {
              // Higher priority for more powerful specials
              let priority = 1;
              if (targetBlock.specialType === 'rainbow') priority = 3;
              else if (targetBlock.specialType === 'bomb') priority = 2;
              specialTargets.push({ row: r, col: c, priority });
            }
          }
        }

        if (specialTargets.length > 0) {
          // Sort by priority and pick the best
          specialTargets.sort((a, b) => b.priority - a.priority);
          const target = specialTargets[0];
          targetRow = target.row;
          targetCol = target.col;
        } else {
          // Priority 2: Find positions with most same-colored neighbors (potential matches)
          const candidates: { row: number; col: number; score: number }[] = [];

          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              const key = `${r}-${c}`;
              if (willBeCleared.has(key)) continue;
              if (!board[r][c].color) continue;

              // Count adjacent same-color blocks
              const color = board[r][c].color;
              let score = 0;
              const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
              for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                  if (board[nr][nc].color === color && !willBeCleared.has(`${nr}-${nc}`)) {
                    score++;
                  }
                }
              }

              // Prefer positions toward the bottom (more blocks above to fall)
              score += r * 0.1;

              if (score > 0) {
                candidates.push({ row: r, col: c, score });
              }
            }
          }

          if (candidates.length > 0) {
            // Sort by score and pick the best
            candidates.sort((a, b) => b.score - a.score);
            const target = candidates[0];
            targetRow = target.row;
            targetCol = target.col;
          } else {
            // Priority 3: Any position not being cleared
            for (let r = GRID_SIZE - 1; r >= 0; r--) {
              for (let c = 0; c < GRID_SIZE; c++) {
                const key = `${r}-${c}`;
                if (!willBeCleared.has(key) && board[r][c].color) {
                  targetRow = r;
                  targetCol = c;
                  break;
                }
              }
              if (targetRow !== -1) break;
            }

            // Fallback to center if somehow everything is being cleared
            if (targetRow === -1) {
              targetRow = Math.floor(GRID_SIZE / 2);
              targetCol = Math.floor(GRID_SIZE / 2);
            }
          }
        }

        // Also add this propeller's target to willBeCleared for subsequent propellers
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = targetRow + dr;
            const c = targetCol + dc;
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
              willBeCleared.add(`${r}-${c}`);
            }
          }
        }

        propellerActivations.push({
          row,
          col,
          targetRow,
          targetCol,
        });
      }
    }
  }

  // Find L/T shaped matches (intersection of horizontal and vertical)
  const intersectionPoints = new Set<string>();
  for (const hMatch of horizontalMatches) {
    for (const vMatch of verticalMatches) {
      // Check if they share a block (intersection point)
      for (const hBlock of hMatch.blocks) {
        for (const vBlock of vMatch.blocks) {
          if (hBlock.row === vBlock.row && hBlock.col === vBlock.col) {
            // Found intersection - this is an L or T shape
            const key = `${hBlock.row}-${hBlock.col}`;
            if (!intersectionPoints.has(key)) {
              intersectionPoints.add(key);
              const color = board[hBlock.row][hBlock.col].color;
              rainbowCreations.push({
                row: hBlock.row,
                col: hBlock.col,
                color,
              });
            }
          }
        }
      }
    }
  }

  // Check for 5+ matches - create rainbow at center
  for (const match of matches) {
    if (match.blocks.length >= 5) {
      const midIndex = Math.floor(match.blocks.length / 2);
      const pos = match.blocks[midIndex];
      const key = `${pos.row}-${pos.col}`;
      // Don't create rainbow if already creating one there (from L/T)
      if (!intersectionPoints.has(key)) {
        const color = board[pos.row][pos.col].color;
        rainbowCreations.push({
          row: pos.row,
          col: pos.col,
          color,
        });
      }
    }
  }

  // Create rockets for 4-length matches (but not if rainbow is being created there)
  const rainbowPositions = new Set(rainbowCreations.map(r => `${r.row}-${r.col}`));

  for (const match of matches) {
    if (match.blocks.length === 4) {
      const midIndex = Math.floor(match.blocks.length / 2);
      const pos = match.blocks[midIndex];
      const key = `${pos.row}-${pos.col}`;

      if (!rainbowPositions.has(key)) {
        const alreadyCreating = rocketCreations.some(
          r => r.row === pos.row && r.col === pos.col
        );
        if (!alreadyCreating) {
          rocketCreations.push({
            row: pos.row,
            col: pos.col,
            type: match.direction === 'horizontal' ? 'rocket-h' : 'rocket-v',
          });
        }
      }
    }
  }

  // Check for ice blocks adjacent to matched blocks (ice breaks when adjacent to matches)
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const match of matches) {
    for (const { row, col } of match.blocks) {
      for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          const adjacentBlock = board[nr][nc];
          if (adjacentBlock.obstacle?.type === 'ice') {
            const iceKey = `${nr}-${nc}`;
            if (!damagedObstacles.has(iceKey)) {
              damagedObstacles.add(iceKey);
              obstacleDamage.push({
                row: nr,
                col: nc,
                type: 'ice',
                destroyed: adjacentBlock.obstacle.health <= 1,
              });
            }
          }
        }
      }
    }
  }

  return { matches, rocketCreations, rocketActivations, rainbowCreations, rainbowActivations, bombCreations, bombActivations, propellerActivations, obstacleDamage };
};

export const removeMatches = (
  board: Board,
  matchResult: MatchResult
): { board: Board; clearedCount: number; obstaclesCleared: ObstacleDamage[] } => {
  const newBoard = cloneBoard(board);
  const toRemove = new Set<string>();
  const obstaclesCleared: ObstacleDamage[] = [];

  // First, apply obstacle damage from the match result
  for (const damage of matchResult.obstacleDamage) {
    const block = newBoard[damage.row][damage.col];
    if (block.obstacle) {
      block.obstacle.health -= 1;
      if (block.obstacle.health <= 0) {
        block.obstacle = null;
        obstaclesCleared.push({ ...damage, destroyed: true });
      } else {
        obstaclesCleared.push({ ...damage, destroyed: false });
      }
    }
  }

  // Mark matched blocks for removal
  for (const match of matchResult.matches) {
    for (const { row, col } of match.blocks) {
      const block = newBoard[row][col];
      // Only remove if no obstacle or obstacle was destroyed
      if (!block.obstacle) {
        toRemove.add(`${row}-${col}`);
      }
    }
  }

  // Handle rocket activations - clear entire row or column
  for (const rocket of matchResult.rocketActivations) {
    if (rocket.type === 'rocket-h') {
      // Clear entire row
      for (let col = 0; col < GRID_SIZE; col++) {
        const block = newBoard[rocket.row][col];
        // Blockers can't be destroyed by rockets
        if (block.obstacle?.type === 'blocker') continue;
        // Damage other obstacles
        if (block.obstacle) {
          const obstacleType = block.obstacle.type;
          block.obstacle.health -= 1;
          if (block.obstacle.health <= 0) {
            block.obstacle = null;
            obstaclesCleared.push({ row: rocket.row, col, type: obstacleType, destroyed: true });
            toRemove.add(`${rocket.row}-${col}`);
          }
        } else {
          toRemove.add(`${rocket.row}-${col}`);
        }
      }
    } else if (rocket.type === 'rocket-v') {
      // Clear entire column
      for (let row = 0; row < GRID_SIZE; row++) {
        const block = newBoard[row][rocket.col];
        // Blockers can't be destroyed by rockets
        if (block.obstacle?.type === 'blocker') continue;
        // Damage other obstacles
        if (block.obstacle) {
          const obstacleType = block.obstacle.type;
          block.obstacle.health -= 1;
          if (block.obstacle.health <= 0) {
            block.obstacle = null;
            obstaclesCleared.push({ row, col: rocket.col, type: obstacleType, destroyed: true });
            toRemove.add(`${row}-${rocket.col}`);
          }
        } else {
          toRemove.add(`${row}-${rocket.col}`);
        }
      }
    }
  }

  // Handle rainbow activations - clear all blocks of the target color
  for (const rainbow of matchResult.rainbowActivations) {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (newBoard[row][col].color === rainbow.targetColor) {
          const block = newBoard[row][col];
          if (block.obstacle?.type === 'blocker') continue;
          if (block.obstacle) {
            const obstacleType = block.obstacle.type;
            block.obstacle.health -= 1;
            if (block.obstacle.health <= 0) {
              block.obstacle = null;
              obstaclesCleared.push({ row, col, type: obstacleType, destroyed: true });
              toRemove.add(`${row}-${col}`);
            }
          } else {
            toRemove.add(`${row}-${col}`);
          }
        }
      }
    }
  }

  // Handle bomb activations - clear 3x3 area
  for (const bomb of matchResult.bombActivations) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = bomb.row + dr;
        const c = bomb.col + dc;
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          const block = newBoard[r][c];
          if (block.obstacle?.type === 'blocker') continue;
          if (block.obstacle) {
            const obstacleType = block.obstacle.type;
            block.obstacle.health -= 1;
            if (block.obstacle.health <= 0) {
              block.obstacle = null;
              obstaclesCleared.push({ row: r, col: c, type: obstacleType, destroyed: true });
              toRemove.add(`${r}-${c}`);
            }
          } else {
            toRemove.add(`${r}-${c}`);
          }
        }
      }
    }
  }

  // Handle propeller activations - clear 3x3 area at target
  for (const propeller of matchResult.propellerActivations) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = propeller.targetRow + dr;
        const c = propeller.targetCol + dc;
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          const block = newBoard[r][c];
          if (block.obstacle?.type === 'blocker') continue;
          if (block.obstacle) {
            const obstacleType = block.obstacle.type;
            block.obstacle.health -= 1;
            if (block.obstacle.health <= 0) {
              block.obstacle = null;
              obstaclesCleared.push({ row: r, col: c, type: obstacleType, destroyed: true });
              toRemove.add(`${r}-${c}`);
            }
          } else {
            toRemove.add(`${r}-${c}`);
          }
        }
      }
    }
  }

  // Remove blocks but keep special block creation positions
  for (const key of toRemove) {
    const [row, col] = key.split('-').map(Number);
    const block = newBoard[row][col];

    // Skip blockers entirely
    if (block.obstacle?.type === 'blocker') continue;

    // Check if this should become a bomb instead of being removed
    const bombCreation = matchResult.bombCreations.find(
      b => b.row === row && b.col === col
    );

    if (bombCreation) {
      // Create bomb block instead of removing
      newBoard[row][col] = {
        ...newBoard[row][col],
        id: `bomb-${row}-${col}-${Date.now()}`,
        specialType: 'bomb',
        color: bombCreation.color,
        obstacle: null,
      };
    } else {
      // Check if this should become a rainbow instead of being removed
      const rainbowCreation = matchResult.rainbowCreations.find(
        r => r.row === row && r.col === col
      );

      if (rainbowCreation) {
        // Create rainbow block instead of removing
        newBoard[row][col] = {
          ...newBoard[row][col],
          id: `rainbow-${row}-${col}-${Date.now()}`,
          specialType: 'rainbow',
          color: rainbowCreation.color,
          obstacle: null,
        };
      } else {
        // Check if this should become a rocket instead of being removed
        const rocketCreation = matchResult.rocketCreations.find(
          r => r.row === row && r.col === col
        );

        if (rocketCreation) {
          // Create rocket block instead of removing
          newBoard[row][col] = {
            ...newBoard[row][col],
            id: `rocket-${row}-${col}-${Date.now()}`,
            specialType: rocketCreation.type,
            obstacle: null,
          };
        } else {
          // Remove the block
          newBoard[row][col] = {
            ...newBoard[row][col],
            color: '',
            specialType: null,
            obstacle: null,
            id: `empty-${row}-${col}-${Date.now()}`,
          };
        }
      }
    }
  }

  return { board: newBoard, clearedCount: toRemove.size, obstaclesCleared };
};

export const applyGravity = (board: Board): Board => {
  const newBoard = cloneBoard(board);

  for (let col = 0; col < GRID_SIZE; col++) {
    let emptyRow = GRID_SIZE - 1;

    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      const block = newBoard[row][col];

      // Blockers don't move and block falling
      if (block.obstacle?.type === 'blocker') {
        // Reset emptyRow to above the blocker
        emptyRow = row - 1;
        continue;
      }

      if (block.color !== '') {
        if (row !== emptyRow) {
          // Move block down, preserving its obstacle
          newBoard[emptyRow][col] = {
            ...block,
            row: emptyRow,
            col,
            id: `${emptyRow}-${col}-${Date.now()}-${Math.random()}`,
          };
          newBoard[row][col] = {
            id: `empty-${row}-${col}-${Date.now()}`,
            color: '',
            row,
            col,
            specialType: null,
            obstacle: null,
          };
        }
        emptyRow--;
      }
    }
  }

  return newBoard;
};

export const fillEmptySpaces = (board: Board): Board => {
  const newBoard = cloneBoard(board);

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const block = newBoard[row][col];
      // Don't fill blocker spaces
      if (block.obstacle?.type === 'blocker') continue;

      if (block.color === '') {
        newBoard[row][col] = {
          id: `${row}-${col}-${Date.now()}-${Math.random()}`,
          color: getRandomColor(),
          row,
          col,
          specialType: null,
          obstacle: null,
        };
      }
    }
  }

  return newBoard;
};

export const calculateScore = (matchResult: MatchResult): number => {
  let score = 0;

  for (const match of matchResult.matches) {
    const blockCount = match.blocks.length;
    score += blockCount * 10;
    if (blockCount > 3) {
      score += (blockCount - 3) * 15;
    }
  }

  // Bonus for rocket activations
  score += matchResult.rocketActivations.length * 50;

  // Bonus for rainbow activations (clearing all of one color is powerful!)
  score += matchResult.rainbowActivations.length * 100;

  // Bonus for bomb activations
  score += matchResult.bombActivations.length * 75;

  // Bonus for propeller activations
  score += matchResult.propellerActivations.length * 60;

  return score;
};
