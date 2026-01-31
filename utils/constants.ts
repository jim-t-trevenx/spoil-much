import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const GRID_SIZE = 8;

// Calculate block size based on screen width
// Leave 40px padding on each side (80px total) for the board container
const AVAILABLE_WIDTH = SCREEN_WIDTH - 80;
const CALCULATED_BLOCK_SIZE = Math.floor(AVAILABLE_WIDTH / GRID_SIZE) - 8; // 8 = margin * 2

export const BLOCK_SIZE = Math.min(Math.max(CALCULATED_BLOCK_SIZE, 32), 48); // Clamp between 32-48px
export const BLOCK_MARGIN = 4;
export const TOTAL_BLOCK_SIZE = BLOCK_SIZE + BLOCK_MARGIN * 2;

// Game mode settings
export const DEFAULT_MOVES = 20;
export const DEFAULT_TIME_LIMIT = 60; // seconds for arcade mode

export const COLORS = [
  '#FF0000', // Red - pure red
  '#00CC00', // Green - bright green
  '#0066FF', // Blue - royal blue
  '#FFCC00', // Yellow - golden yellow
  '#FF00FF', // Magenta - hot pink
  '#FF6600', // Orange - bright orange
];

export const getRandomColor = () => {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};
