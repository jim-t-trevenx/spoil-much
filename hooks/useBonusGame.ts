import { useCallback } from 'react';
import { InGamePowerUpType } from '../types/boosters';

export type BonusGameType = 'wheel' | 'chest' | 'scratch';

export type Prize = {
  type: 'coins' | 'booster' | 'life' | 'nothing';
  amount?: number;
  boosterType?: InGamePowerUpType;
  label: string;
  icon: string;
};

// Wheel prizes (8 segments)
export const WHEEL_PRIZES: Prize[] = [
  { type: 'coins', amount: 50, label: '50', icon: '🪙' },
  { type: 'coins', amount: 100, label: '100', icon: '🪙' },
  { type: 'coins', amount: 200, label: '200', icon: '🪙' },
  { type: 'booster', boosterType: 'hammer', label: 'Hammer', icon: '🔨' },
  { type: 'booster', boosterType: 'shuffle', label: 'Shuffle', icon: '🔀' },
  { type: 'booster', boosterType: 'color_bomb', label: 'Color Bomb', icon: '🎨' },
  { type: 'coins', amount: 500, label: 'JACKPOT!', icon: '💰' },
  { type: 'life', amount: 1, label: '+1 Life', icon: '❤️' },
];

// Chest prizes (3 tiers)
export const CHEST_PRIZES = {
  big: [
    { type: 'coins' as const, amount: 200, label: '200 Coins', icon: '🪙' },
    { type: 'booster' as const, boosterType: 'color_bomb' as InGamePowerUpType, label: 'Color Bomb', icon: '🎨' },
    { type: 'booster' as const, boosterType: 'row_blast' as InGamePowerUpType, label: 'Row Blast', icon: '💥' },
  ],
  medium: [
    { type: 'coins' as const, amount: 100, label: '100 Coins', icon: '🪙' },
    { type: 'booster' as const, boosterType: 'hammer' as InGamePowerUpType, label: 'Hammer', icon: '🔨' },
  ],
  small: [
    { type: 'coins' as const, amount: 50, label: '50 Coins', icon: '🪙' },
    { type: 'coins' as const, amount: 75, label: '75 Coins', icon: '🪙' },
  ],
};

// Scratch card symbols
export type ScratchSymbol = {
  id: string;
  icon: string;
  prize: Prize;
};

export const SCRATCH_SYMBOLS: ScratchSymbol[] = [
  { id: 'coins', icon: '🪙', prize: { type: 'coins', amount: 100, label: '100 Coins', icon: '🪙' } },
  { id: 'hammer', icon: '🔨', prize: { type: 'booster', boosterType: 'hammer', label: 'Hammer', icon: '🔨' } },
  { id: 'diamond', icon: '💎', prize: { type: 'coins', amount: 300, label: '300 Coins', icon: '💎' } },
  { id: 'star', icon: '⭐', prize: { type: 'life', amount: 1, label: '+1 Life', icon: '❤️' } },
  { id: 'jackpot', icon: '🎰', prize: { type: 'coins', amount: 500, label: 'JACKPOT!', icon: '💰' } },
];

export const useBonusGame = () => {
  // Select random bonus game type
  const selectRandomGame = useCallback((): BonusGameType => {
    const games: BonusGameType[] = ['wheel', 'chest', 'scratch'];
    return games[Math.floor(Math.random() * games.length)];
  }, []);

  // Generate wheel result (weighted by stars)
  const generateWheelResult = useCallback((earnedStars: number): number => {
    // Better odds for higher stars
    const weights = earnedStars >= 3
      ? [5, 10, 15, 15, 15, 15, 10, 15] // More boosters, jackpot
      : earnedStars >= 2
        ? [10, 15, 15, 15, 15, 10, 5, 15] // Balanced
        : [20, 20, 15, 10, 10, 10, 5, 10]; // More coins

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) return i;
    }
    return 0;
  }, []);

  // Generate chest prizes (shuffled)
  const generateChestPrizes = useCallback((earnedStars: number): Prize[] => {
    const big = CHEST_PRIZES.big[Math.floor(Math.random() * CHEST_PRIZES.big.length)];
    const medium = CHEST_PRIZES.medium[Math.floor(Math.random() * CHEST_PRIZES.medium.length)];
    const small = CHEST_PRIZES.small[Math.floor(Math.random() * CHEST_PRIZES.small.length)];

    // Shuffle the prizes into random positions
    const prizes = [big, medium, small];
    for (let i = prizes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [prizes[i], prizes[j]] = [prizes[j], prizes[i]];
    }

    return prizes;
  }, []);

  // Generate scratch card grid (6 cells, pre-determined winner)
  const generateScratchGrid = useCallback((earnedStars: number): ScratchSymbol[] => {
    // Pick winning symbol (better odds for higher stars)
    const winningSymbolIndex = earnedStars >= 3
      ? Math.floor(Math.random() * SCRATCH_SYMBOLS.length) // Any symbol
      : earnedStars >= 2
        ? Math.floor(Math.random() * 3) // First 3 symbols (no jackpot)
        : Math.floor(Math.random() * 2); // Coins or hammer only

    const winningSymbol = SCRATCH_SYMBOLS[winningSymbolIndex];

    // Create grid with 3 winning symbols and 3 random others
    const grid: ScratchSymbol[] = [
      winningSymbol,
      winningSymbol,
      winningSymbol,
    ];

    // Add 3 random non-winning symbols
    const otherSymbols = SCRATCH_SYMBOLS.filter(s => s.id !== winningSymbol.id);
    for (let i = 0; i < 3; i++) {
      grid.push(otherSymbols[Math.floor(Math.random() * otherSymbols.length)]);
    }

    // Shuffle the grid
    for (let i = grid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [grid[i], grid[j]] = [grid[j], grid[i]];
    }

    return grid;
  }, []);

  // Check scratch card for winner (3 matching symbols)
  const checkScratchWinner = useCallback((revealed: ScratchSymbol[]): Prize | null => {
    const counts: Record<string, number> = {};
    for (const symbol of revealed) {
      counts[symbol.id] = (counts[symbol.id] || 0) + 1;
      if (counts[symbol.id] >= 3) {
        return symbol.prize;
      }
    }
    return null;
  }, []);

  return {
    selectRandomGame,
    generateWheelResult,
    generateChestPrizes,
    generateScratchGrid,
    checkScratchWinner,
    WHEEL_PRIZES,
  };
};
