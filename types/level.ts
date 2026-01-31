import { Difficulty, SpecialType } from '../utils/boardUtils';

// Objective types for level completion
export type ObjectiveType =
  | { type: 'clearColor'; color: string; count: number }
  | { type: 'reachScore'; score: number }
  | { type: 'clearObstacle'; obstacle: ObstacleType; count: number }
  | { type: 'collectItem'; item: CollectibleType; count: number }
  | { type: 'useSpecial'; specialType: SpecialType; count: number };

// Obstacle types (for milestone 1.3)
export type ObstacleType = 'box' | 'ice' | 'chain' | 'blocker' | 'grass';

// Collectible item types
export type CollectibleType = 'crown' | 'star' | 'key';

// Progress tracking for a single objective
export type ObjectiveProgress = {
  objective: ObjectiveType;
  current: number;
  target: number;
  completed: boolean;
};

// Level configuration
export type LevelConfig = {
  id: number;
  name?: string;
  moves: number;
  objectives: ObjectiveType[];
  difficulty?: Difficulty;
  // Grid customization (for future use)
  gridWidth?: number;
  gridHeight?: number;
  // Initial board state (for designed levels)
  initialBoard?: string[][]; // Color codes or special markers
  // Obstacles on the board (for milestone 1.3)
  obstacles?: Array<{
    type: ObstacleType;
    row: number;
    col: number;
    health?: number; // For multi-hit obstacles like boxes
  }>;
};

// Level completion result
export type LevelResult = {
  completed: boolean;
  score: number;
  movesUsed: number;
  movesRemaining: number;
  stars: number; // 1-3 based on performance
  objectiveProgress: ObjectiveProgress[];
};

// Helper to create common objective types
export const createObjective = {
  clearColor: (color: string, count: number): ObjectiveType => ({
    type: 'clearColor',
    color,
    count,
  }),
  reachScore: (score: number): ObjectiveType => ({
    type: 'reachScore',
    score,
  }),
  clearObstacle: (obstacle: ObstacleType, count: number): ObjectiveType => ({
    type: 'clearObstacle',
    obstacle,
    count,
  }),
  collectItem: (item: CollectibleType, count: number): ObjectiveType => ({
    type: 'collectItem',
    item,
    count,
  }),
  useSpecial: (specialType: SpecialType, count: number): ObjectiveType => ({
    type: 'useSpecial',
    specialType,
    count,
  }),
};

// Color name mapping for display
export const COLOR_NAMES: Record<string, string> = {
  '#FF0000': 'Red',
  '#00CC00': 'Green',
  '#0066FF': 'Blue',
  '#FFCC00': 'Yellow',
  '#FF00FF': 'Pink',
  '#FF6600': 'Orange',
};

// Get display name for a color
export const getColorName = (color: string): string => {
  return COLOR_NAMES[color] || color;
};

// Get display text for an objective
export const getObjectiveText = (objective: ObjectiveType): string => {
  switch (objective.type) {
    case 'clearColor':
      return `Clear ${objective.count} ${getColorName(objective.color)}`;
    case 'reachScore':
      return `Score ${objective.score.toLocaleString()}`;
    case 'clearObstacle':
      return `Clear ${objective.count} ${objective.obstacle}`;
    case 'collectItem':
      return `Collect ${objective.count} ${objective.item}`;
    case 'useSpecial':
      return `Use ${objective.count} ${objective.specialType || 'special'}`;
    default:
      return 'Unknown objective';
  }
};
