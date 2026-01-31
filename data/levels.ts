import { LevelConfig, ObjectiveType, ObstacleType } from '../types/level';
import { COLORS } from '../utils/constants';

// Level difficulty curve helpers
const easyMoves = (base: number) => base + 5;
const mediumMoves = (base: number) => base;
const hardMoves = (base: number) => Math.max(base - 3, 10);

// World themes (for future visual customization)
export type WorldTheme = 'garden' | 'castle' | 'forest' | 'beach' | 'mountain';

export type World = {
  id: number;
  name: string;
  theme: WorldTheme;
  levels: number[]; // Level IDs in this world
};

// Worlds configuration
export const WORLDS: World[] = [
  { id: 1, name: 'Royal Garden', theme: 'garden', levels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: 2, name: 'Castle Gates', theme: 'castle', levels: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
  { id: 3, name: 'Enchanted Forest', theme: 'forest', levels: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
  { id: 4, name: 'Sunny Beach', theme: 'beach', levels: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40] },
  { id: 5, name: 'Misty Mountains', theme: 'mountain', levels: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50] },
];

// Level definitions
export const LEVELS: LevelConfig[] = [
  // === WORLD 1: Royal Garden (Levels 1-10) - Tutorial & Basics ===
  {
    id: 1,
    name: 'First Steps',
    moves: 25,
    objectives: [
      { type: 'clearColor', color: COLORS[0], count: 20 },
    ],
  },
  {
    id: 2,
    name: 'Color Match',
    moves: 22,
    objectives: [
      { type: 'clearColor', color: COLORS[1], count: 25 },
    ],
  },
  {
    id: 3,
    name: 'Double Trouble',
    moves: 25,
    objectives: [
      { type: 'clearColor', color: COLORS[0], count: 20 },
      { type: 'clearColor', color: COLORS[2], count: 20 },
    ],
  },
  {
    id: 4,
    name: 'Score Rush',
    moves: 20,
    objectives: [
      { type: 'reachScore', score: 5000 },
    ],
  },
  {
    id: 5,
    name: 'Box Breaker',
    moves: 22,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 3 },
    ],
    obstacles: [
      { type: 'box', row: 2, col: 3, health: 2 },
      { type: 'box', row: 2, col: 4, health: 2 },
      { type: 'box', row: 5, col: 3, health: 2 },
    ],
  },
  {
    id: 6,
    name: 'Ice Cold',
    moves: 20,
    objectives: [
      { type: 'clearColor', color: COLORS[2], count: 30 },
    ],
    obstacles: [
      { type: 'ice', row: 3, col: 2 },
      { type: 'ice', row: 3, col: 3 },
      { type: 'ice', row: 3, col: 4 },
      { type: 'ice', row: 3, col: 5 },
    ],
  },
  {
    id: 7,
    name: 'Garden Path',
    moves: 24,
    objectives: [
      { type: 'clearObstacle', obstacle: 'grass', count: 5 },
    ],
    obstacles: [
      { type: 'grass', row: 0, col: 0 },
      { type: 'grass', row: 0, col: 7 },
      { type: 'grass', row: 7, col: 0 },
      { type: 'grass', row: 7, col: 7 },
      { type: 'grass', row: 3, col: 3 },
    ],
  },
  {
    id: 8,
    name: 'Triple Challenge',
    moves: 25,
    objectives: [
      { type: 'clearColor', color: COLORS[0], count: 15 },
      { type: 'clearColor', color: COLORS[1], count: 15 },
      { type: 'clearColor', color: COLORS[2], count: 15 },
    ],
  },
  {
    id: 9,
    name: 'Box Fort',
    moves: 25,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 6 },
    ],
    obstacles: [
      { type: 'box', row: 2, col: 2, health: 2 },
      { type: 'box', row: 2, col: 5, health: 2 },
      { type: 'box', row: 3, col: 3, health: 2 },
      { type: 'box', row: 3, col: 4, health: 2 },
      { type: 'box', row: 5, col: 2, health: 2 },
      { type: 'box', row: 5, col: 5, health: 2 },
    ],
  },
  {
    id: 10,
    name: 'Garden Boss',
    moves: 30,
    objectives: [
      { type: 'clearColor', color: COLORS[3], count: 40 },
      { type: 'clearObstacle', obstacle: 'box', count: 4 },
      { type: 'reachScore', score: 8000 },
    ],
    obstacles: [
      { type: 'box', row: 1, col: 3, health: 3 },
      { type: 'box', row: 1, col: 4, health: 3 },
      { type: 'box', row: 6, col: 3, health: 3 },
      { type: 'box', row: 6, col: 4, health: 3 },
    ],
  },

  // === WORLD 2: Castle Gates (Levels 11-20) - Chains & Combos ===
  {
    id: 11,
    name: 'Chain Gang',
    moves: 22,
    objectives: [
      { type: 'clearObstacle', obstacle: 'chain', count: 4 },
    ],
    obstacles: [
      { type: 'chain', row: 2, col: 2 },
      { type: 'chain', row: 2, col: 5 },
      { type: 'chain', row: 5, col: 2 },
      { type: 'chain', row: 5, col: 5 },
    ],
  },
  {
    id: 12,
    name: 'Ice & Chain',
    moves: 24,
    objectives: [
      { type: 'clearObstacle', obstacle: 'ice', count: 6 },
      { type: 'clearObstacle', obstacle: 'chain', count: 4 },
    ],
    obstacles: [
      { type: 'ice', row: 1, col: 3 },
      { type: 'ice', row: 1, col: 4 },
      { type: 'ice', row: 6, col: 3 },
      { type: 'ice', row: 6, col: 4 },
      { type: 'ice', row: 3, col: 1 },
      { type: 'ice', row: 4, col: 6 },
      { type: 'chain', row: 3, col: 3 },
      { type: 'chain', row: 3, col: 4 },
      { type: 'chain', row: 4, col: 3 },
      { type: 'chain', row: 4, col: 4 },
    ],
  },
  {
    id: 13,
    name: 'Castle Colors',
    moves: 20,
    objectives: [
      { type: 'clearColor', color: COLORS[4], count: 35 },
    ],
  },
  {
    id: 14,
    name: 'Stone Wall',
    moves: 25,
    objectives: [
      { type: 'clearColor', color: COLORS[0], count: 30 },
      { type: 'clearColor', color: COLORS[2], count: 30 },
    ],
    obstacles: [
      { type: 'blocker', row: 3, col: 0 },
      { type: 'blocker', row: 4, col: 0 },
      { type: 'blocker', row: 3, col: 7 },
      { type: 'blocker', row: 4, col: 7 },
    ],
  },
  {
    id: 15,
    name: 'Box Maze',
    moves: 28,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 8 },
    ],
    obstacles: [
      { type: 'box', row: 1, col: 1, health: 2 },
      { type: 'box', row: 1, col: 6, health: 2 },
      { type: 'box', row: 2, col: 3, health: 2 },
      { type: 'box', row: 2, col: 4, health: 2 },
      { type: 'box', row: 5, col: 3, health: 2 },
      { type: 'box', row: 5, col: 4, health: 2 },
      { type: 'box', row: 6, col: 1, health: 2 },
      { type: 'box', row: 6, col: 6, health: 2 },
    ],
  },
  {
    id: 16,
    name: 'Frozen Castle',
    moves: 22,
    objectives: [
      { type: 'clearObstacle', obstacle: 'ice', count: 10 },
    ],
    obstacles: [
      { type: 'ice', row: 2, col: 2 },
      { type: 'ice', row: 2, col: 3 },
      { type: 'ice', row: 2, col: 4 },
      { type: 'ice', row: 2, col: 5 },
      { type: 'ice', row: 3, col: 2 },
      { type: 'ice', row: 3, col: 5 },
      { type: 'ice', row: 4, col: 2 },
      { type: 'ice', row: 4, col: 5 },
      { type: 'ice', row: 5, col: 2 },
      { type: 'ice', row: 5, col: 5 },
    ],
  },
  {
    id: 17,
    name: 'High Score',
    moves: 18,
    objectives: [
      { type: 'reachScore', score: 10000 },
    ],
    difficulty: 'easy',
  },
  {
    id: 18,
    name: 'Chain Reaction',
    moves: 26,
    objectives: [
      { type: 'clearObstacle', obstacle: 'chain', count: 8 },
      { type: 'clearColor', color: COLORS[1], count: 25 },
    ],
    obstacles: [
      { type: 'chain', row: 1, col: 2 },
      { type: 'chain', row: 1, col: 5 },
      { type: 'chain', row: 2, col: 3 },
      { type: 'chain', row: 2, col: 4 },
      { type: 'chain', row: 5, col: 3 },
      { type: 'chain', row: 5, col: 4 },
      { type: 'chain', row: 6, col: 2 },
      { type: 'chain', row: 6, col: 5 },
    ],
  },
  {
    id: 19,
    name: 'Grass Invasion',
    moves: 25,
    objectives: [
      { type: 'clearObstacle', obstacle: 'grass', count: 8 },
    ],
    obstacles: [
      { type: 'grass', row: 0, col: 3 },
      { type: 'grass', row: 0, col: 4 },
      { type: 'grass', row: 3, col: 0 },
      { type: 'grass', row: 4, col: 0 },
      { type: 'grass', row: 3, col: 7 },
      { type: 'grass', row: 4, col: 7 },
      { type: 'grass', row: 7, col: 3 },
      { type: 'grass', row: 7, col: 4 },
    ],
  },
  {
    id: 20,
    name: 'Castle Boss',
    moves: 32,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 6 },
      { type: 'clearObstacle', obstacle: 'chain', count: 6 },
      { type: 'reachScore', score: 12000 },
    ],
    obstacles: [
      { type: 'box', row: 2, col: 2, health: 3 },
      { type: 'box', row: 2, col: 5, health: 3 },
      { type: 'box', row: 5, col: 2, health: 3 },
      { type: 'box', row: 5, col: 5, health: 3 },
      { type: 'box', row: 3, col: 3, health: 3 },
      { type: 'box', row: 4, col: 4, health: 3 },
      { type: 'chain', row: 1, col: 3 },
      { type: 'chain', row: 1, col: 4 },
      { type: 'chain', row: 6, col: 3 },
      { type: 'chain', row: 6, col: 4 },
      { type: 'chain', row: 3, col: 1 },
      { type: 'chain', row: 4, col: 6 },
    ],
  },

  // === WORLD 3: Enchanted Forest (Levels 21-30) - Grass Focus ===
  {
    id: 21,
    name: 'Forest Entry',
    moves: 22,
    objectives: [
      { type: 'clearColor', color: COLORS[1], count: 35 },
    ],
    obstacles: [
      { type: 'grass', row: 0, col: 0 },
      { type: 'grass', row: 7, col: 7 },
    ],
  },
  {
    id: 22,
    name: 'Overgrown',
    moves: 25,
    objectives: [
      { type: 'clearObstacle', obstacle: 'grass', count: 12 },
    ],
    obstacles: [
      { type: 'grass', row: 0, col: 0 },
      { type: 'grass', row: 0, col: 1 },
      { type: 'grass', row: 1, col: 0 },
      { type: 'grass', row: 0, col: 6 },
      { type: 'grass', row: 0, col: 7 },
      { type: 'grass', row: 1, col: 7 },
      { type: 'grass', row: 6, col: 0 },
      { type: 'grass', row: 7, col: 0 },
      { type: 'grass', row: 7, col: 1 },
      { type: 'grass', row: 6, col: 7 },
      { type: 'grass', row: 7, col: 6 },
      { type: 'grass', row: 7, col: 7 },
    ],
  },
  {
    id: 23,
    name: 'Hidden Boxes',
    moves: 26,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 4 },
      { type: 'clearObstacle', obstacle: 'grass', count: 8 },
    ],
    obstacles: [
      { type: 'box', row: 3, col: 3, health: 2 },
      { type: 'box', row: 3, col: 4, health: 2 },
      { type: 'box', row: 4, col: 3, health: 2 },
      { type: 'box', row: 4, col: 4, health: 2 },
      { type: 'grass', row: 2, col: 2 },
      { type: 'grass', row: 2, col: 5 },
      { type: 'grass', row: 5, col: 2 },
      { type: 'grass', row: 5, col: 5 },
      { type: 'grass', row: 2, col: 3 },
      { type: 'grass', row: 2, col: 4 },
      { type: 'grass', row: 5, col: 3 },
      { type: 'grass', row: 5, col: 4 },
    ],
  },
  {
    id: 24,
    name: 'Forest Colors',
    moves: 20,
    objectives: [
      { type: 'clearColor', color: COLORS[1], count: 30 },
      { type: 'clearColor', color: COLORS[3], count: 30 },
    ],
  },
  {
    id: 25,
    name: 'Frozen Forest',
    moves: 24,
    objectives: [
      { type: 'clearObstacle', obstacle: 'ice', count: 8 },
      { type: 'clearObstacle', obstacle: 'grass', count: 6 },
    ],
    obstacles: [
      { type: 'ice', row: 2, col: 3 },
      { type: 'ice', row: 2, col: 4 },
      { type: 'ice', row: 3, col: 2 },
      { type: 'ice', row: 3, col: 5 },
      { type: 'ice', row: 4, col: 2 },
      { type: 'ice', row: 4, col: 5 },
      { type: 'ice', row: 5, col: 3 },
      { type: 'ice', row: 5, col: 4 },
      { type: 'grass', row: 0, col: 0 },
      { type: 'grass', row: 0, col: 7 },
      { type: 'grass', row: 7, col: 0 },
      { type: 'grass', row: 7, col: 7 },
      { type: 'grass', row: 3, col: 3 },
      { type: 'grass', row: 4, col: 4 },
    ],
  },
  {
    id: 26,
    name: 'Big Score',
    moves: 22,
    objectives: [
      { type: 'reachScore', score: 15000 },
    ],
    difficulty: 'easy',
  },
  {
    id: 27,
    name: 'Chain Forest',
    moves: 26,
    objectives: [
      { type: 'clearObstacle', obstacle: 'chain', count: 8 },
      { type: 'clearObstacle', obstacle: 'grass', count: 4 },
    ],
    obstacles: [
      { type: 'chain', row: 1, col: 1 },
      { type: 'chain', row: 1, col: 6 },
      { type: 'chain', row: 2, col: 2 },
      { type: 'chain', row: 2, col: 5 },
      { type: 'chain', row: 5, col: 2 },
      { type: 'chain', row: 5, col: 5 },
      { type: 'chain', row: 6, col: 1 },
      { type: 'chain', row: 6, col: 6 },
      { type: 'grass', row: 3, col: 3 },
      { type: 'grass', row: 3, col: 4 },
      { type: 'grass', row: 4, col: 3 },
      { type: 'grass', row: 4, col: 4 },
    ],
  },
  {
    id: 28,
    name: 'Stone Pillars',
    moves: 28,
    objectives: [
      { type: 'clearColor', color: COLORS[0], count: 40 },
      { type: 'clearColor', color: COLORS[1], count: 40 },
    ],
    obstacles: [
      { type: 'blocker', row: 0, col: 3 },
      { type: 'blocker', row: 1, col: 3 },
      { type: 'blocker', row: 0, col: 4 },
      { type: 'blocker', row: 1, col: 4 },
      { type: 'blocker', row: 6, col: 3 },
      { type: 'blocker', row: 7, col: 3 },
      { type: 'blocker', row: 6, col: 4 },
      { type: 'blocker', row: 7, col: 4 },
    ],
  },
  {
    id: 29,
    name: 'All Obstacles',
    moves: 30,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 4 },
      { type: 'clearObstacle', obstacle: 'ice', count: 4 },
      { type: 'clearObstacle', obstacle: 'chain', count: 4 },
    ],
    obstacles: [
      { type: 'box', row: 1, col: 1, health: 2 },
      { type: 'box', row: 1, col: 6, health: 2 },
      { type: 'box', row: 6, col: 1, health: 2 },
      { type: 'box', row: 6, col: 6, health: 2 },
      { type: 'ice', row: 2, col: 3 },
      { type: 'ice', row: 2, col: 4 },
      { type: 'ice', row: 5, col: 3 },
      { type: 'ice', row: 5, col: 4 },
      { type: 'chain', row: 3, col: 2 },
      { type: 'chain', row: 3, col: 5 },
      { type: 'chain', row: 4, col: 2 },
      { type: 'chain', row: 4, col: 5 },
    ],
  },
  {
    id: 30,
    name: 'Forest Boss',
    moves: 35,
    objectives: [
      { type: 'clearObstacle', obstacle: 'grass', count: 15 },
      { type: 'clearObstacle', obstacle: 'box', count: 4 },
      { type: 'reachScore', score: 18000 },
    ],
    obstacles: [
      { type: 'box', row: 3, col: 3, health: 3 },
      { type: 'box', row: 3, col: 4, health: 3 },
      { type: 'box', row: 4, col: 3, health: 3 },
      { type: 'box', row: 4, col: 4, health: 3 },
      { type: 'grass', row: 0, col: 0 },
      { type: 'grass', row: 0, col: 1 },
      { type: 'grass', row: 0, col: 2 },
      { type: 'grass', row: 1, col: 0 },
      { type: 'grass', row: 2, col: 0 },
      { type: 'grass', row: 0, col: 5 },
      { type: 'grass', row: 0, col: 6 },
      { type: 'grass', row: 0, col: 7 },
      { type: 'grass', row: 1, col: 7 },
      { type: 'grass', row: 2, col: 7 },
      { type: 'grass', row: 7, col: 3 },
      { type: 'grass', row: 7, col: 4 },
      { type: 'grass', row: 6, col: 3 },
    ],
  },

  // === WORLD 4: Sunny Beach (Levels 31-40) - Mixed Challenges ===
  {
    id: 31,
    name: 'Beach Day',
    moves: 20,
    objectives: [
      { type: 'clearColor', color: COLORS[3], count: 40 },
    ],
  },
  {
    id: 32,
    name: 'Sand Castles',
    moves: 24,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 6 },
    ],
    obstacles: [
      { type: 'box', row: 1, col: 2, health: 2 },
      { type: 'box', row: 1, col: 5, health: 2 },
      { type: 'box', row: 3, col: 1, health: 2 },
      { type: 'box', row: 3, col: 6, health: 2 },
      { type: 'box', row: 5, col: 2, health: 2 },
      { type: 'box', row: 5, col: 5, health: 2 },
    ],
  },
  {
    id: 33,
    name: 'Tide Pool',
    moves: 22,
    objectives: [
      { type: 'clearObstacle', obstacle: 'ice', count: 12 },
    ],
    obstacles: [
      { type: 'ice', row: 3, col: 2 },
      { type: 'ice', row: 3, col: 3 },
      { type: 'ice', row: 3, col: 4 },
      { type: 'ice', row: 3, col: 5 },
      { type: 'ice', row: 4, col: 2 },
      { type: 'ice', row: 4, col: 3 },
      { type: 'ice', row: 4, col: 4 },
      { type: 'ice', row: 4, col: 5 },
      { type: 'ice', row: 2, col: 3 },
      { type: 'ice', row: 2, col: 4 },
      { type: 'ice', row: 5, col: 3 },
      { type: 'ice', row: 5, col: 4 },
    ],
  },
  {
    id: 34,
    name: 'Seaweed',
    moves: 24,
    objectives: [
      { type: 'clearObstacle', obstacle: 'grass', count: 10 },
      { type: 'clearColor', color: COLORS[2], count: 30 },
    ],
    obstacles: [
      { type: 'grass', row: 0, col: 0 },
      { type: 'grass', row: 0, col: 1 },
      { type: 'grass', row: 1, col: 0 },
      { type: 'grass', row: 7, col: 0 },
      { type: 'grass', row: 7, col: 1 },
      { type: 'grass', row: 6, col: 0 },
      { type: 'grass', row: 0, col: 6 },
      { type: 'grass', row: 0, col: 7 },
      { type: 'grass', row: 1, col: 7 },
      { type: 'grass', row: 7, col: 7 },
    ],
  },
  {
    id: 35,
    name: 'Score Wave',
    moves: 20,
    objectives: [
      { type: 'reachScore', score: 20000 },
    ],
    difficulty: 'easy',
  },
  {
    id: 36,
    name: 'Rocky Shore',
    moves: 26,
    objectives: [
      { type: 'clearColor', color: COLORS[0], count: 35 },
      { type: 'clearColor', color: COLORS[4], count: 35 },
    ],
    obstacles: [
      { type: 'blocker', row: 3, col: 3 },
      { type: 'blocker', row: 3, col: 4 },
      { type: 'blocker', row: 4, col: 3 },
      { type: 'blocker', row: 4, col: 4 },
    ],
  },
  {
    id: 37,
    name: 'Beach Mix',
    moves: 28,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 4 },
      { type: 'clearObstacle', obstacle: 'ice', count: 6 },
      { type: 'clearObstacle', obstacle: 'chain', count: 4 },
    ],
    obstacles: [
      { type: 'box', row: 1, col: 3, health: 2 },
      { type: 'box', row: 1, col: 4, health: 2 },
      { type: 'box', row: 6, col: 3, health: 2 },
      { type: 'box', row: 6, col: 4, health: 2 },
      { type: 'ice', row: 3, col: 1 },
      { type: 'ice', row: 4, col: 1 },
      { type: 'ice', row: 3, col: 6 },
      { type: 'ice', row: 4, col: 6 },
      { type: 'ice', row: 3, col: 3 },
      { type: 'ice', row: 4, col: 4 },
      { type: 'chain', row: 2, col: 2 },
      { type: 'chain', row: 2, col: 5 },
      { type: 'chain', row: 5, col: 2 },
      { type: 'chain', row: 5, col: 5 },
    ],
  },
  {
    id: 38,
    name: 'Sunset Colors',
    moves: 22,
    objectives: [
      { type: 'clearColor', color: COLORS[0], count: 25 },
      { type: 'clearColor', color: COLORS[3], count: 25 },
      { type: 'clearColor', color: COLORS[5], count: 25 },
    ],
  },
  {
    id: 39,
    name: 'Buried Treasure',
    moves: 30,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 8 },
    ],
    obstacles: [
      { type: 'box', row: 2, col: 2, health: 3 },
      { type: 'box', row: 2, col: 5, health: 3 },
      { type: 'box', row: 3, col: 3, health: 3 },
      { type: 'box', row: 3, col: 4, health: 3 },
      { type: 'box', row: 4, col: 3, health: 3 },
      { type: 'box', row: 4, col: 4, health: 3 },
      { type: 'box', row: 5, col: 2, health: 3 },
      { type: 'box', row: 5, col: 5, health: 3 },
    ],
  },
  {
    id: 40,
    name: 'Beach Boss',
    moves: 35,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 6 },
      { type: 'clearObstacle', obstacle: 'ice', count: 8 },
      { type: 'clearObstacle', obstacle: 'grass', count: 6 },
      { type: 'reachScore', score: 25000 },
    ],
    obstacles: [
      { type: 'box', row: 2, col: 3, health: 3 },
      { type: 'box', row: 2, col: 4, health: 3 },
      { type: 'box', row: 5, col: 3, health: 3 },
      { type: 'box', row: 5, col: 4, health: 3 },
      { type: 'box', row: 3, col: 2, health: 3 },
      { type: 'box', row: 4, col: 5, health: 3 },
      { type: 'ice', row: 1, col: 1 },
      { type: 'ice', row: 1, col: 6 },
      { type: 'ice', row: 6, col: 1 },
      { type: 'ice', row: 6, col: 6 },
      { type: 'ice', row: 3, col: 3 },
      { type: 'ice', row: 3, col: 4 },
      { type: 'ice', row: 4, col: 3 },
      { type: 'ice', row: 4, col: 4 },
      { type: 'grass', row: 0, col: 0 },
      { type: 'grass', row: 0, col: 7 },
      { type: 'grass', row: 7, col: 0 },
      { type: 'grass', row: 7, col: 7 },
      { type: 'grass', row: 3, col: 0 },
      { type: 'grass', row: 4, col: 7 },
    ],
  },

  // === WORLD 5: Misty Mountains (Levels 41-50) - Expert Challenges ===
  {
    id: 41,
    name: 'Mountain Path',
    moves: 20,
    objectives: [
      { type: 'clearColor', color: COLORS[2], count: 45 },
    ],
    obstacles: [
      { type: 'blocker', row: 2, col: 0 },
      { type: 'blocker', row: 3, col: 0 },
      { type: 'blocker', row: 4, col: 7 },
      { type: 'blocker', row: 5, col: 7 },
    ],
  },
  {
    id: 42,
    name: 'Icy Peaks',
    moves: 24,
    objectives: [
      { type: 'clearObstacle', obstacle: 'ice', count: 16 },
    ],
    obstacles: [
      { type: 'ice', row: 1, col: 2 },
      { type: 'ice', row: 1, col: 3 },
      { type: 'ice', row: 1, col: 4 },
      { type: 'ice', row: 1, col: 5 },
      { type: 'ice', row: 2, col: 2 },
      { type: 'ice', row: 2, col: 5 },
      { type: 'ice', row: 5, col: 2 },
      { type: 'ice', row: 5, col: 5 },
      { type: 'ice', row: 6, col: 2 },
      { type: 'ice', row: 6, col: 3 },
      { type: 'ice', row: 6, col: 4 },
      { type: 'ice', row: 6, col: 5 },
      { type: 'ice', row: 3, col: 3 },
      { type: 'ice', row: 3, col: 4 },
      { type: 'ice', row: 4, col: 3 },
      { type: 'ice', row: 4, col: 4 },
    ],
  },
  {
    id: 43,
    name: 'Boulder Field',
    moves: 26,
    objectives: [
      { type: 'clearColor', color: COLORS[0], count: 40 },
      { type: 'clearColor', color: COLORS[1], count: 40 },
    ],
    obstacles: [
      { type: 'blocker', row: 1, col: 1 },
      { type: 'blocker', row: 1, col: 6 },
      { type: 'blocker', row: 3, col: 3 },
      { type: 'blocker', row: 4, col: 4 },
      { type: 'blocker', row: 6, col: 1 },
      { type: 'blocker', row: 6, col: 6 },
    ],
  },
  {
    id: 44,
    name: 'Chain Mountains',
    moves: 28,
    objectives: [
      { type: 'clearObstacle', obstacle: 'chain', count: 12 },
    ],
    obstacles: [
      { type: 'chain', row: 1, col: 1 },
      { type: 'chain', row: 1, col: 2 },
      { type: 'chain', row: 1, col: 5 },
      { type: 'chain', row: 1, col: 6 },
      { type: 'chain', row: 3, col: 3 },
      { type: 'chain', row: 3, col: 4 },
      { type: 'chain', row: 4, col: 3 },
      { type: 'chain', row: 4, col: 4 },
      { type: 'chain', row: 6, col: 1 },
      { type: 'chain', row: 6, col: 2 },
      { type: 'chain', row: 6, col: 5 },
      { type: 'chain', row: 6, col: 6 },
    ],
  },
  {
    id: 45,
    name: 'Mega Score',
    moves: 25,
    objectives: [
      { type: 'reachScore', score: 30000 },
    ],
    difficulty: 'easy',
  },
  {
    id: 46,
    name: 'Fortress',
    moves: 30,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 10 },
    ],
    obstacles: [
      { type: 'box', row: 1, col: 2, health: 3 },
      { type: 'box', row: 1, col: 3, health: 3 },
      { type: 'box', row: 1, col: 4, health: 3 },
      { type: 'box', row: 1, col: 5, health: 3 },
      { type: 'box', row: 6, col: 2, health: 3 },
      { type: 'box', row: 6, col: 3, health: 3 },
      { type: 'box', row: 6, col: 4, health: 3 },
      { type: 'box', row: 6, col: 5, health: 3 },
      { type: 'box', row: 3, col: 3, health: 3 },
      { type: 'box', row: 4, col: 4, health: 3 },
    ],
  },
  {
    id: 47,
    name: 'Alpine Grass',
    moves: 28,
    objectives: [
      { type: 'clearObstacle', obstacle: 'grass', count: 20 },
    ],
    obstacles: [
      { type: 'grass', row: 0, col: 0 },
      { type: 'grass', row: 0, col: 1 },
      { type: 'grass', row: 0, col: 2 },
      { type: 'grass', row: 1, col: 0 },
      { type: 'grass', row: 1, col: 1 },
      { type: 'grass', row: 2, col: 0 },
      { type: 'grass', row: 0, col: 5 },
      { type: 'grass', row: 0, col: 6 },
      { type: 'grass', row: 0, col: 7 },
      { type: 'grass', row: 1, col: 6 },
      { type: 'grass', row: 1, col: 7 },
      { type: 'grass', row: 2, col: 7 },
      { type: 'grass', row: 5, col: 0 },
      { type: 'grass', row: 6, col: 0 },
      { type: 'grass', row: 6, col: 1 },
      { type: 'grass', row: 7, col: 0 },
      { type: 'grass', row: 7, col: 1 },
      { type: 'grass', row: 7, col: 2 },
      { type: 'grass', row: 7, col: 5 },
      { type: 'grass', row: 7, col: 6 },
    ],
  },
  {
    id: 48,
    name: 'Summit Mix',
    moves: 32,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 6 },
      { type: 'clearObstacle', obstacle: 'ice', count: 6 },
      { type: 'clearObstacle', obstacle: 'chain', count: 6 },
      { type: 'clearObstacle', obstacle: 'grass', count: 6 },
    ],
    obstacles: [
      { type: 'box', row: 1, col: 1, health: 2 },
      { type: 'box', row: 1, col: 6, health: 2 },
      { type: 'box', row: 6, col: 1, health: 2 },
      { type: 'box', row: 6, col: 6, health: 2 },
      { type: 'box', row: 3, col: 3, health: 2 },
      { type: 'box', row: 4, col: 4, health: 2 },
      { type: 'ice', row: 2, col: 3 },
      { type: 'ice', row: 2, col: 4 },
      { type: 'ice', row: 5, col: 3 },
      { type: 'ice', row: 5, col: 4 },
      { type: 'ice', row: 3, col: 2 },
      { type: 'ice', row: 4, col: 5 },
      { type: 'chain', row: 0, col: 3 },
      { type: 'chain', row: 0, col: 4 },
      { type: 'chain', row: 7, col: 3 },
      { type: 'chain', row: 7, col: 4 },
      { type: 'chain', row: 3, col: 0 },
      { type: 'chain', row: 4, col: 7 },
      { type: 'grass', row: 0, col: 0 },
      { type: 'grass', row: 0, col: 7 },
      { type: 'grass', row: 7, col: 0 },
      { type: 'grass', row: 7, col: 7 },
      { type: 'grass', row: 3, col: 4 },
      { type: 'grass', row: 4, col: 3 },
    ],
  },
  {
    id: 49,
    name: 'Rainbow Rush',
    moves: 22,
    objectives: [
      { type: 'clearColor', color: COLORS[0], count: 30 },
      { type: 'clearColor', color: COLORS[1], count: 30 },
      { type: 'clearColor', color: COLORS[2], count: 30 },
      { type: 'clearColor', color: COLORS[3], count: 30 },
    ],
  },
  {
    id: 50,
    name: 'Mountain Boss',
    moves: 40,
    objectives: [
      { type: 'clearObstacle', obstacle: 'box', count: 8 },
      { type: 'clearObstacle', obstacle: 'ice', count: 8 },
      { type: 'clearObstacle', obstacle: 'chain', count: 8 },
      { type: 'reachScore', score: 40000 },
    ],
    obstacles: [
      { type: 'box', row: 0, col: 3, health: 3 },
      { type: 'box', row: 0, col: 4, health: 3 },
      { type: 'box', row: 7, col: 3, health: 3 },
      { type: 'box', row: 7, col: 4, health: 3 },
      { type: 'box', row: 3, col: 0, health: 3 },
      { type: 'box', row: 4, col: 0, health: 3 },
      { type: 'box', row: 3, col: 7, health: 3 },
      { type: 'box', row: 4, col: 7, health: 3 },
      { type: 'ice', row: 2, col: 2 },
      { type: 'ice', row: 2, col: 5 },
      { type: 'ice', row: 5, col: 2 },
      { type: 'ice', row: 5, col: 5 },
      { type: 'ice', row: 3, col: 3 },
      { type: 'ice', row: 3, col: 4 },
      { type: 'ice', row: 4, col: 3 },
      { type: 'ice', row: 4, col: 4 },
      { type: 'chain', row: 1, col: 1 },
      { type: 'chain', row: 1, col: 6 },
      { type: 'chain', row: 6, col: 1 },
      { type: 'chain', row: 6, col: 6 },
      { type: 'chain', row: 2, col: 3 },
      { type: 'chain', row: 2, col: 4 },
      { type: 'chain', row: 5, col: 3 },
      { type: 'chain', row: 5, col: 4 },
    ],
  },
];

// Get level by ID
export const getLevel = (id: number): LevelConfig | undefined => {
  return LEVELS.find(level => level.id === id);
};

// Get world by level ID
export const getWorldForLevel = (levelId: number): World | undefined => {
  return WORLDS.find(world => world.levels.includes(levelId));
};

// Get all levels for a world
export const getLevelsForWorld = (worldId: number): LevelConfig[] => {
  const world = WORLDS.find(w => w.id === worldId);
  if (!world) return [];
  return world.levels.map(id => getLevel(id)).filter((l): l is LevelConfig => l !== undefined);
};

// Get next level ID
export const getNextLevelId = (currentId: number): number | null => {
  const currentIndex = LEVELS.findIndex(l => l.id === currentId);
  if (currentIndex === -1 || currentIndex === LEVELS.length - 1) return null;
  return LEVELS[currentIndex + 1].id;
};

// Get total level count
export const getTotalLevelCount = (): number => LEVELS.length;
