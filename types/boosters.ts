// Pre-game boosters (selected before level starts)
export type PreGameBoosterType =
  | 'extra_moves'      // +5 moves
  | 'rocket_start'     // Start with 2 rockets on board
  | 'bomb_start'       // Start with 1 bomb on board
  | 'rainbow_start';   // Start with 1 rainbow on board

// In-game power-ups (used during gameplay)
export type InGamePowerUpType =
  | 'hammer'           // Destroy single block
  | 'shuffle'          // Shuffle the board
  | 'extra_time'       // +15 seconds (arcade mode)
  | 'color_bomb'       // Clear all of one color
  | 'row_blast';       // Clear entire row

export type BoosterInventory = {
  extra_moves: number;
  rocket_start: number;
  bomb_start: number;
  rainbow_start: number;
  hammer: number;
  shuffle: number;
  extra_time: number;
  color_bomb: number;
  row_blast: number;
};

export type BoosterInfo = {
  id: PreGameBoosterType | InGamePowerUpType;
  name: string;
  description: string;
  icon: string;
  cost: number; // Coins to purchase
  category: 'pre-game' | 'in-game';
};

export const BOOSTER_INFO: Record<PreGameBoosterType | InGamePowerUpType, BoosterInfo> = {
  // Pre-game boosters
  extra_moves: {
    id: 'extra_moves',
    name: '+5 Moves',
    description: 'Start the level with 5 extra moves',
    icon: '➕',
    cost: 100,
    category: 'pre-game',
  },
  rocket_start: {
    id: 'rocket_start',
    name: 'Rocket Start',
    description: 'Start with 2 rockets on the board',
    icon: '🚀',
    cost: 150,
    category: 'pre-game',
  },
  bomb_start: {
    id: 'bomb_start',
    name: 'Bomb Start',
    description: 'Start with a bomb on the board',
    icon: '💣',
    cost: 200,
    category: 'pre-game',
  },
  rainbow_start: {
    id: 'rainbow_start',
    name: 'Rainbow Start',
    description: 'Start with a rainbow on the board',
    icon: '🌈',
    cost: 250,
    category: 'pre-game',
  },
  // In-game power-ups
  hammer: {
    id: 'hammer',
    name: 'Hammer',
    description: 'Destroy any single block',
    icon: '🔨',
    cost: 50,
    category: 'in-game',
  },
  shuffle: {
    id: 'shuffle',
    name: 'Shuffle',
    description: 'Shuffle all blocks on the board',
    icon: '🔀',
    cost: 75,
    category: 'in-game',
  },
  extra_time: {
    id: 'extra_time',
    name: '+15 Seconds',
    description: 'Add 15 seconds to the timer',
    icon: '⏱️',
    cost: 100,
    category: 'in-game',
  },
  color_bomb: {
    id: 'color_bomb',
    name: 'Color Bomb',
    description: 'Clear all blocks of one color',
    icon: '🎨',
    cost: 150,
    category: 'in-game',
  },
  row_blast: {
    id: 'row_blast',
    name: 'Row Blast',
    description: 'Clear an entire row',
    icon: '💥',
    cost: 100,
    category: 'in-game',
  },
};

export const DEFAULT_INVENTORY: BoosterInventory = {
  extra_moves: 3,
  rocket_start: 2,
  bomb_start: 2,
  rainbow_start: 1,
  hammer: 5,
  shuffle: 3,
  extra_time: 2,
  color_bomb: 2,
  row_blast: 3,
};

export const getPreGameBoosters = (): PreGameBoosterType[] => [
  'extra_moves',
  'rocket_start',
  'bomb_start',
  'rainbow_start',
];

export const getInGamePowerUps = (): InGamePowerUpType[] => [
  'hammer',
  'shuffle',
  'extra_time',
  'color_bomb',
  'row_blast',
];
