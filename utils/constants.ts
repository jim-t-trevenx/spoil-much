export const GRID_SIZE = 8;
export const BLOCK_SIZE = 40;
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
