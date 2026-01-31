import { useState, useCallback, useEffect, useRef } from 'react';
import { Board, createInitialBoard, swapBlocks, areAdjacent, Difficulty, cloneBoard } from '../utils/boardUtils';
import { GRID_SIZE, DEFAULT_MOVES, DEFAULT_TIME_LIMIT } from '../utils/constants';
import { LevelConfig, ObjectiveProgress, ObjectiveType } from '../types/level';

export type GameMode = 'classic' | 'arcade';

// Helper to get target count from an objective
const getObjectiveTarget = (objective: ObjectiveType): number => {
  switch (objective.type) {
    case 'clearColor':
      return objective.count;
    case 'reachScore':
      return objective.score;
    case 'clearObstacle':
      return objective.count;
    case 'collectItem':
      return objective.count;
    case 'useSpecial':
      return objective.count;
    default:
      return 0;
  }
};
import {
  findMatches,
  removeMatches,
  applyGravity,
  fillEmptySpaces,
  calculateScore,
  MatchResult,
} from '../utils/matchDetection';
import { SwappingPair } from '../components/Board';
import { useDemoMode } from './useDemoMode';

type GameState = 'idle' | 'animating' | 'checking' | 'removing' | 'falling' | 'filling';

export type ExplodingBlock = {
  row: number;
  col: number;
  isRocket: boolean;
};

export type PowerUpActivations = {
  rockets: { row: number; col: number; type: 'rocket-h' | 'rocket-v' }[];
  rainbows: { row: number; col: number; targetColor: string }[];
  bombs: { row: number; col: number; size?: number }[]; // size: 3 for normal, 5 for bomb+bomb
  propellers: { row: number; col: number; targetRow: number; targetCol: number }[];
  combos: ComboActivation[];
};

// Combo types when two special blocks are swapped
export type ComboType =
  | 'rocket-rocket'      // Giant cross (row + column)
  | 'rocket-bomb'        // 3 rows or 3 columns
  | 'rocket-rainbow'     // All of one color become rockets
  | 'bomb-bomb'          // 5x5 explosion
  | 'bomb-rainbow'       // All of one color become bombs
  | 'rainbow-rainbow'    // Clear entire board
  | 'propeller-rocket'   // 3 propellers
  | 'propeller-bomb'     // Propeller with 5x5 explosion
  | 'propeller-rainbow'  // 3 propellers to best targets
  | 'propeller-propeller'; // 3 propellers

export type ComboActivation = {
  type: ComboType;
  row: number;
  col: number;
  targetColor?: string;
  direction?: 'horizontal' | 'vertical';
};

// Animation durations for power-ups (in ms)
const POWER_UP_DURATIONS = {
  rocket: 400,
  rainbow: 500,
  bomb: 350,
  propeller: 1300, // Liftoff (150) + Search (600) + Dive (350) + Impact (200)
  combo: 700, // Combos get extra time
  base: 350, // Base explosion time
};

type UseGameLogicOptions = {
  difficulty?: Difficulty;
  demoMode?: boolean;
  gameMode?: GameMode;
  maxMoves?: number;
  timeLimit?: number; // seconds for arcade mode
  levelConfig?: LevelConfig; // Level objectives and settings
};

export const useGameLogic = (options: UseGameLogicOptions | Difficulty = 'medium') => {
  // Handle both old signature (difficulty only) and new signature (options object)
  const {
    difficulty = 'medium',
    demoMode = false,
    gameMode = 'classic',
    maxMoves = DEFAULT_MOVES,
    timeLimit = DEFAULT_TIME_LIMIT,
    levelConfig,
  } = typeof options === 'string' ? { difficulty: options } : options;

  const isArcadeMode = gameMode === 'arcade';
  const hasObjectives = levelConfig && levelConfig.objectives.length > 0;

  // Use level config moves if provided, otherwise use maxMoves
  const effectiveMaxMoves = levelConfig?.moves ?? maxMoves;
  const [board, setBoard] = useState<Board>(() => createInitialBoard(difficulty));
  const [score, setScore] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<{ row: number; col: number } | null>(null);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [combo, setCombo] = useState(0);
  const [swappingPair, setSwappingPair] = useState<SwappingPair>(null);
  const [pendingSwap, setPendingSwap] = useState<SwappingPair>(null);
  const [explodingBlocks, setExplodingBlocks] = useState<ExplodingBlock[]>([]);
  const [powerUpActivations, setPowerUpActivations] = useState<PowerUpActivations>({
    rockets: [],
    rainbows: [],
    bombs: [],
    propellers: [],
    combos: [],
  });
  const [pendingCombo, setPendingCombo] = useState<{
    type: ComboType;
    row: number;
    col: number;
    color: string;
  } | null>(null);

  // Timer state (arcade mode)
  const [timeRemaining, setTimeRemaining] = useState(isArcadeMode ? timeLimit : null);

  // Moves state (classic mode)
  const [movesRemaining, setMovesRemaining] = useState(isArcadeMode ? null : effectiveMaxMoves);

  const [isGameOver, setIsGameOver] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize objective progress from level config
  const initializeObjectiveProgress = useCallback((): ObjectiveProgress[] => {
    if (!levelConfig || !levelConfig.objectives.length) return [];
    return levelConfig.objectives.map(objective => ({
      objective,
      current: 0,
      target: getObjectiveTarget(objective),
      completed: false,
    }));
  }, [levelConfig]);

  const [objectiveProgress, setObjectiveProgress] = useState<ObjectiveProgress[]>(
    () => initializeObjectiveProgress()
  );

  // Start/manage countdown timer (arcade mode only)
  useEffect(() => {
    if (!isArcadeMode || demoMode || isGameOver) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Time's up!
          if (timerRef.current) clearInterval(timerRef.current);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isArcadeMode, demoMode, isGameOver]);

  // Update objective progress based on cleared blocks
  const updateObjectiveProgress = useCallback((
    clearedBlocks: Array<{ row: number; col: number }>,
    currentBoard: Board,
    earnedScore: number
  ) => {
    if (!hasObjectives) return;

    // Count cleared blocks by color
    const colorCounts: Record<string, number> = {};
    for (const { row, col } of clearedBlocks) {
      const color = currentBoard[row]?.[col]?.color;
      if (color) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    }

    setObjectiveProgress(prev => {
      const updated = prev.map(progress => {
        if (progress.completed) return progress;

        let newCurrent = progress.current;

        switch (progress.objective.type) {
          case 'clearColor':
            const colorObj = progress.objective;
            newCurrent += colorCounts[colorObj.color] || 0;
            break;
          case 'reachScore':
            // Score objectives track cumulative score
            newCurrent = score + earnedScore;
            break;
          // Other objective types will be handled in future milestones
        }

        const completed = newCurrent >= progress.target;
        return {
          ...progress,
          current: Math.min(newCurrent, progress.target),
          completed,
        };
      });

      // Check if all objectives are complete
      const allComplete = updated.every(p => p.completed);
      if (allComplete && !isLevelComplete) {
        // Delay level complete to let animations finish
        setTimeout(() => setIsLevelComplete(true), 500);
      }

      return updated;
    });
  }, [hasObjectives, score, isLevelComplete]);

  const processMatchesRef = useRef<(() => void) | undefined>(undefined);

  const processMatches = useCallback(() => {
    const matchResult = findMatches(board);

    if (matchResult.matches.length > 0) {
      setGameState('removing');

      // Collect all exploding blocks
      const exploding: ExplodingBlock[] = [];
      const specialClearedPositions = new Set<string>();

      // Track positions cleared by rockets
      for (const rocket of matchResult.rocketActivations) {
        if (rocket.type === 'rocket-h') {
          for (let col = 0; col < 8; col++) {
            specialClearedPositions.add(`${rocket.row}-${col}`);
          }
        } else {
          for (let row = 0; row < 8; row++) {
            specialClearedPositions.add(`${row}-${rocket.col}`);
          }
        }
      }

      // Track positions cleared by rainbows
      for (const rainbow of matchResult.rainbowActivations) {
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            if (board[row][col].color === rainbow.targetColor) {
              specialClearedPositions.add(`${row}-${col}`);
            }
          }
        }
      }

      // Track positions cleared by bombs (3x3 area)
      for (const bomb of matchResult.bombActivations) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = bomb.row + dr;
            const c = bomb.col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
              specialClearedPositions.add(`${r}-${c}`);
            }
          }
        }
      }

      // Track positions cleared by propellers (3x3 area at target)
      for (const propeller of matchResult.propellerActivations) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = propeller.targetRow + dr;
            const c = propeller.targetCol + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
              specialClearedPositions.add(`${r}-${c}`);
            }
          }
        }
      }

      // Add matched blocks
      for (const match of matchResult.matches) {
        for (const { row, col } of match.blocks) {
          const key = `${row}-${col}`;
          const isRocket = specialClearedPositions.has(key);
          if (!exploding.some(e => e.row === row && e.col === col)) {
            exploding.push({ row, col, isRocket });
          }
        }
      }

      // Add special-cleared blocks (rockets and rainbows)
      for (const key of specialClearedPositions) {
        const [row, col] = key.split('-').map(Number);
        if (!exploding.some(e => e.row === row && e.col === col)) {
          exploding.push({ row, col, isRocket: true });
        }
      }

      setExplodingBlocks(exploding);

      // Store power-up activations for animation
      const activations: PowerUpActivations = {
        rockets: matchResult.rocketActivations,
        rainbows: matchResult.rainbowActivations,
        bombs: matchResult.bombActivations.map(b => ({ ...b, size: 3 })),
        propellers: matchResult.propellerActivations,
        combos: [],
      };
      setPowerUpActivations(activations);

      // Calculate animation duration based on active power-ups
      let animationDuration = POWER_UP_DURATIONS.base;
      if (activations.propellers.length > 0) {
        animationDuration = Math.max(animationDuration, POWER_UP_DURATIONS.propeller);
      }
      if (activations.rainbows.length > 0) {
        animationDuration = Math.max(animationDuration, POWER_UP_DURATIONS.rainbow);
      }
      if (activations.rockets.length > 0) {
        animationDuration = Math.max(animationDuration, POWER_UP_DURATIONS.rocket);
      }
      if (activations.bombs.length > 0) {
        animationDuration = Math.max(animationDuration, POWER_UP_DURATIONS.bomb);
      }

      const baseScore = calculateScore(matchResult);
      const comboMultiplier = 1 + combo * 0.5;
      const earnedScore = Math.floor(baseScore * comboMultiplier);
      setScore(prev => prev + earnedScore);
      setCombo(prev => prev + 1);

      // Update objective progress with cleared blocks
      updateObjectiveProgress(exploding, board, earnedScore);

      setTimeout(() => {
        const { board: boardAfterRemoval } = removeMatches(board, matchResult);
        setBoard(boardAfterRemoval);
        setExplodingBlocks([]);
        setPowerUpActivations({ rockets: [], rainbows: [], bombs: [], propellers: [], combos: [] });
        setGameState('falling');

        setTimeout(() => {
          const boardAfterGravity = applyGravity(boardAfterRemoval);
          setBoard(boardAfterGravity);
          setGameState('filling');

          setTimeout(() => {
            const filledBoard = fillEmptySpaces(boardAfterGravity);
            setBoard(filledBoard);
            setGameState('checking');
          }, 150);
        }, 150);
      }, animationDuration); // Dynamic duration based on power-ups
    } else {
      setCombo(0);
      setGameState('idle');

      // Check for game over in classic mode (no moves remaining and objectives not complete)
      if (!isArcadeMode && movesRemaining !== null && movesRemaining <= 0 && !isLevelComplete) {
        setIsGameOver(true);
      }
    }
  }, [board, combo, isArcadeMode, movesRemaining, isLevelComplete, updateObjectiveProgress]);

  processMatchesRef.current = processMatches;

  useEffect(() => {
    if (gameState === 'checking' && processMatchesRef.current) {
      const timer = setTimeout(() => {
        processMatchesRef.current?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [gameState, board]);

  // Detect combo type from two special blocks
  const detectComboType = (type1: string | null, type2: string | null): ComboType | null => {
    const types = [type1, type2].sort();
    const key = types.join('+');

    // Normalize rocket types
    const normalize = (t: string | null) => {
      if (t === 'rocket-h' || t === 'rocket-v') return 'rocket';
      return t;
    };
    const n1 = normalize(type1);
    const n2 = normalize(type2);
    const normalizedKey = [n1, n2].sort().join('+');

    const comboMap: Record<string, ComboType> = {
      'rocket+rocket': 'rocket-rocket',
      'bomb+rocket': 'rocket-bomb',
      'rainbow+rocket': 'rocket-rainbow',
      'bomb+bomb': 'bomb-bomb',
      'bomb+rainbow': 'bomb-rainbow',
      'rainbow+rainbow': 'rainbow-rainbow',
      'propeller+rocket': 'propeller-rocket',
      'bomb+propeller': 'propeller-bomb',
      'propeller+rainbow': 'propeller-rainbow',
      'propeller+propeller': 'propeller-propeller',
    };

    return comboMap[normalizedKey] || null;
  };

  // Execute combo effect
  const executeCombo = useCallback((
    comboType: ComboType,
    row: number,
    col: number,
    color: string,
    currentBoard: Board
  ) => {
    const newBoard = cloneBoard(currentBoard);
    const toRemove = new Set<string>();
    const activations: PowerUpActivations = {
      rockets: [],
      rainbows: [],
      bombs: [],
      propellers: [],
      combos: [{ type: comboType, row, col, targetColor: color }],
    };

    // Clear the two swapped positions first
    toRemove.add(`${row}-${col}`);

    switch (comboType) {
      case 'rocket-rocket':
        // Giant cross - clear entire row AND column
        for (let c = 0; c < GRID_SIZE; c++) {
          toRemove.add(`${row}-${c}`);
        }
        for (let r = 0; r < GRID_SIZE; r++) {
          toRemove.add(`${r}-${col}`);
        }
        activations.rockets.push({ row, col, type: 'rocket-h' });
        activations.rockets.push({ row, col, type: 'rocket-v' });
        break;

      case 'rocket-bomb':
        // Clear 3 rows (horizontal rocket effect on 3 rows)
        for (let dr = -1; dr <= 1; dr++) {
          const r = row + dr;
          if (r >= 0 && r < GRID_SIZE) {
            for (let c = 0; c < GRID_SIZE; c++) {
              toRemove.add(`${r}-${c}`);
            }
          }
        }
        activations.rockets.push({ row, col, type: 'rocket-h' });
        activations.bombs.push({ row, col });
        break;

      case 'bomb-bomb':
        // Massive 5x5 explosion
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
              toRemove.add(`${r}-${c}`);
            }
          }
        }
        activations.bombs.push({ row, col, size: 5 });
        break;

      case 'rainbow-rainbow':
        // Clear ENTIRE board
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            toRemove.add(`${r}-${c}`);
          }
        }
        activations.rainbows.push({ row, col, targetColor: 'all' });
        break;

      case 'rocket-rainbow':
        // All blocks of target color become rockets and fire
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (newBoard[r][c].color === color) {
              toRemove.add(`${r}-${c}`);
              // Each becomes a rocket that fires
              const rocketType = Math.random() > 0.5 ? 'rocket-h' : 'rocket-v';
              if (rocketType === 'rocket-h') {
                for (let cc = 0; cc < GRID_SIZE; cc++) {
                  toRemove.add(`${r}-${cc}`);
                }
              } else {
                for (let rr = 0; rr < GRID_SIZE; rr++) {
                  toRemove.add(`${rr}-${c}`);
                }
              }
              activations.rockets.push({ row: r, col: c, type: rocketType });
            }
          }
        }
        break;

      case 'bomb-rainbow':
        // All blocks of target color become bombs and explode
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (newBoard[r][c].color === color) {
              // Each becomes a bomb that explodes
              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  const nr = r + dr;
                  const nc = c + dc;
                  if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                    toRemove.add(`${nr}-${nc}`);
                  }
                }
              }
              activations.bombs.push({ row: r, col: c });
            }
          }
        }
        break;

      case 'propeller-rocket':
      case 'propeller-propeller':
        // 3 propellers fly to different targets
        const targets1 = findBestPropellerTargets(newBoard, 3, toRemove);
        for (const target of targets1) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const r = target.row + dr;
              const c = target.col + dc;
              if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                toRemove.add(`${r}-${c}`);
              }
            }
          }
          activations.propellers.push({ row, col, targetRow: target.row, targetCol: target.col });
        }
        break;

      case 'propeller-bomb':
        // Propeller flies to target with 5x5 explosion
        const targets2 = findBestPropellerTargets(newBoard, 1, toRemove);
        if (targets2.length > 0) {
          const target = targets2[0];
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const r = target.row + dr;
              const c = target.col + dc;
              if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                toRemove.add(`${r}-${c}`);
              }
            }
          }
          activations.propellers.push({ row, col, targetRow: target.row, targetCol: target.col });
          activations.bombs.push({ row: target.row, col: target.col, size: 5 });
        }
        break;

      case 'propeller-rainbow':
        // 3 propellers to best targets
        const targets3 = findBestPropellerTargets(newBoard, 3, toRemove);
        for (const target of targets3) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const r = target.row + dr;
              const c = target.col + dc;
              if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                toRemove.add(`${r}-${c}`);
              }
            }
          }
          activations.propellers.push({ row, col, targetRow: target.row, targetCol: target.col });
        }
        break;
    }

    // Calculate score for combo
    const comboScore = 200 + toRemove.size * 15;
    setScore(prev => prev + comboScore);
    setCombo(prev => prev + 1);

    // Update objective progress with cleared blocks from combo
    const comboExploding = Array.from(toRemove).map(key => {
      const [r, c] = key.split('-').map(Number);
      return { row: r, col: c };
    });
    updateObjectiveProgress(comboExploding, currentBoard, comboScore);

    // Set up exploding blocks
    const exploding: ExplodingBlock[] = [];
    for (const key of toRemove) {
      const [r, c] = key.split('-').map(Number);
      exploding.push({ row: r, col: c, isRocket: true });
    }
    setExplodingBlocks(exploding);
    setPowerUpActivations(activations);
    setGameState('removing');

    // After animation, remove blocks
    setTimeout(() => {
      for (const key of toRemove) {
        const [r, c] = key.split('-').map(Number);
        newBoard[r][c] = {
          ...newBoard[r][c],
          color: '',
          specialType: null,
          id: `empty-${r}-${c}-${Date.now()}`,
        };
      }
      setBoard(newBoard);
      setExplodingBlocks([]);
      setPowerUpActivations({ rockets: [], rainbows: [], bombs: [], propellers: [], combos: [] });
      setGameState('falling');

      setTimeout(() => {
        const boardAfterGravity = applyGravity(newBoard);
        setBoard(boardAfterGravity);
        setGameState('filling');

        setTimeout(() => {
          const filledBoard = fillEmptySpaces(boardAfterGravity);
          setBoard(filledBoard);
          setGameState('checking');
        }, 150);
      }, 150);
    }, POWER_UP_DURATIONS.combo);
  }, [updateObjectiveProgress]);

  // Find best targets for propeller combos
  const findBestPropellerTargets = (
    board: Board,
    count: number,
    alreadyCleared: Set<string>
  ): { row: number; col: number }[] => {
    const candidates: { row: number; col: number; score: number }[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (alreadyCleared.has(`${r}-${c}`)) continue;
        if (!board[r][c].color) continue;

        let score = 0;
        // Prioritize special blocks
        if (board[r][c].specialType === 'rainbow') score += 100;
        else if (board[r][c].specialType === 'bomb') score += 80;
        else if (board[r][c].specialType === 'rocket-h' || board[r][c].specialType === 'rocket-v') score += 60;
        else if (board[r][c].specialType === 'propeller') score += 40;

        // Prefer bottom of board
        score += r * 2;

        candidates.push({ row: r, col: c, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, count);
  };

  // Called when swap animation completes
  const onSwapAnimationComplete = useCallback(() => {
    if (!pendingSwap) return;

    const { from, to } = pendingSwap;
    const block1 = board[from.row][from.col];
    const block2 = board[to.row][to.col];

    // Check if two special blocks are being swapped
    const isSpecial = (type: typeof block1.specialType) =>
      type === 'rocket-h' || type === 'rocket-v' || type === 'rainbow' || type === 'bomb' || type === 'propeller';

    if (isSpecial(block1.specialType) && isSpecial(block2.specialType)) {
      const comboType = detectComboType(block1.specialType, block2.specialType);

      if (comboType) {
        // Perform the swap first
        const newBoard = swapBlocks(board, from.row, from.col, to.row, to.col);
        setBoard(newBoard);
        setSwappingPair(null);
        setSelectedBlock(null);
        setPendingSwap(null);

        // Execute the combo effect
        const targetColor = block1.color || block2.color;
        executeCombo(comboType, to.row, to.col, targetColor, newBoard);
        return;
      }
    }

    const newBoard = swapBlocks(board, from.row, from.col, to.row, to.col);
    const matchResult = findMatches(newBoard);

    setSwappingPair(null);

    if (matchResult.matches.length > 0) {
      setBoard(newBoard);
      setSelectedBlock(null);
      setPendingSwap(null);
      setGameState('checking');
    } else {
      // Invalid swap - animate back
      setBoard(newBoard);
      // Set up reverse animation
      setSwappingPair({ from: to, to: from });
      setPendingSwap({ from: to, to: from, isReverse: true } as any);
    }
  }, [board, pendingSwap, executeCombo]);

  // Handle reverse animation complete
  useEffect(() => {
    if (pendingSwap && (pendingSwap as any).isReverse) {
      // This will be called after reverse animation
    }
  }, [pendingSwap]);

  const onReverseAnimationComplete = useCallback(() => {
    if (!pendingSwap) return;

    const { from, to } = pendingSwap;
    const revertedBoard = swapBlocks(board, from.row, from.col, to.row, to.col);
    setBoard(revertedBoard);
    setSwappingPair(null);
    setPendingSwap(null);
    setGameState('idle');
  }, [board, pendingSwap]);

  // Modified to handle both forward and reverse animations
  const handleSwapAnimationComplete = useCallback(() => {
    if (!pendingSwap) return;

    if ((pendingSwap as any).isReverse) {
      onReverseAnimationComplete();
    } else {
      onSwapAnimationComplete();
    }
  }, [pendingSwap, onSwapAnimationComplete, onReverseAnimationComplete]);

  const initiateSwap = useCallback(
    (row1: number, col1: number, row2: number, col2: number) => {
      if (gameState !== 'idle' || isGameOver) return;

      // Decrement moves in classic mode
      if (!isArcadeMode && movesRemaining !== null) {
        const newMoves = movesRemaining - 1;
        setMovesRemaining(newMoves);

        // Check for game over (no moves left)
        // Note: Game over triggers after this swap completes if no matches
        if (newMoves <= 0) {
          // We'll check game over after the swap animation completes
          // For now, allow the last move to play out
        }
      }

      setGameState('animating');
      setSwappingPair({
        from: { row: row1, col: col1 },
        to: { row: row2, col: col2 },
      });
      setPendingSwap({
        from: { row: row1, col: col1 },
        to: { row: row2, col: col2 },
      });
    },
    [gameState, isGameOver, isArcadeMode, movesRemaining]
  );

  const handleSwipe = useCallback(
    (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
      initiateSwap(fromRow, fromCol, toRow, toCol);
    },
    [initiateSwap]
  );

  const handleBlockPress = useCallback(
    (row: number, col: number) => {
      if (gameState !== 'idle' || isGameOver) return;

      if (selectedBlock === null) {
        setSelectedBlock({ row, col });
      } else {
        if (selectedBlock.row === row && selectedBlock.col === col) {
          setSelectedBlock(null);
          return;
        }

        if (areAdjacent(selectedBlock.row, selectedBlock.col, row, col)) {
          initiateSwap(selectedBlock.row, selectedBlock.col, row, col);
          setSelectedBlock(null);
        } else {
          setSelectedBlock({ row, col });
        }
      }
    },
    [selectedBlock, gameState, initiateSwap, isGameOver]
  );

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard(difficulty));
    setScore(0);
    setSelectedBlock(null);
    setGameState('idle');
    setCombo(0);
    setSwappingPair(null);
    setPendingSwap(null);
    setExplodingBlocks([]);
    setPowerUpActivations({ rockets: [], rainbows: [], bombs: [], propellers: [], combos: [] });
    setIsGameOver(false);
    setIsLevelComplete(false);
    setObjectiveProgress(initializeObjectiveProgress());

    // Reset timer or moves based on game mode
    if (isArcadeMode) {
      setTimeRemaining(timeLimit);
      setMovesRemaining(null);
    } else {
      setTimeRemaining(null);
      setMovesRemaining(effectiveMaxMoves);
    }
  }, [difficulty, isArcadeMode, timeLimit, effectiveMaxMoves, initializeObjectiveProgress]);

  // Demo mode: automatically make moves
  useDemoMode({
    isActive: demoMode,
    board,
    gameState,
    handleSwipe,
  });

  return {
    board,
    score,
    selectedBlock,
    gameState,
    combo,
    swappingPair,
    explodingBlocks,
    powerUpActivations,
    demoMode,
    gameMode,
    timeRemaining,
    movesRemaining,
    isGameOver,
    isLevelComplete,
    objectiveProgress,
    levelConfig,
    handleBlockPress,
    handleSwipe,
    handleSwapAnimationComplete,
    resetGame,
  };
};
