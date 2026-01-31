import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = '@spoil_much_progress';
const LIVES_KEY = '@spoil_much_lives';

export type LevelProgress = {
  completed: boolean;
  stars: number; // 0-3
  highScore: number;
  bestMoves: number; // Moves remaining when completed
};

export type GameProgress = {
  currentLevel: number;
  levels: Record<number, LevelProgress>;
  totalStars: number;
  coins: number;
};

export type LivesState = {
  current: number;
  max: number;
  lastLostAt: number | null; // Timestamp when last life was lost
  regenerationMinutes: number;
};

const DEFAULT_PROGRESS: GameProgress = {
  currentLevel: 1,
  levels: {},
  totalStars: 0,
  coins: 500, // Starting coins
};

const DEFAULT_LIVES: LivesState = {
  current: 5,
  max: 5,
  lastLostAt: null,
  regenerationMinutes: 30,
};

// Calculate stars based on performance
export const calculateStars = (
  movesUsed: number,
  maxMoves: number,
  score: number,
  objectivesCompleted: boolean
): number => {
  if (!objectivesCompleted) return 0;

  const movesRemaining = maxMoves - movesUsed;
  const movePercentage = movesRemaining / maxMoves;

  // 3 stars: 40%+ moves remaining
  if (movePercentage >= 0.4) return 3;
  // 2 stars: 20%+ moves remaining
  if (movePercentage >= 0.2) return 2;
  // 1 star: completed
  return 1;
};

export const useProgress = () => {
  const [progress, setProgress] = useState<GameProgress>(DEFAULT_PROGRESS);
  const [loading, setLoading] = useState(true);

  // Load progress from storage
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const stored = await AsyncStorage.getItem(PROGRESS_KEY);
        if (stored) {
          setProgress(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, []);

  // Save progress to storage
  const saveProgress = useCallback(async (newProgress: GameProgress) => {
    try {
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, []);

  // Complete a level with stars
  const completeLevel = useCallback(async (
    levelId: number,
    stars: number,
    score: number,
    movesRemaining: number
  ) => {
    const existingLevel = progress.levels[levelId];
    const isNewBest = !existingLevel || stars > existingLevel.stars;
    const isNewHighScore = !existingLevel || score > existingLevel.highScore;

    const newLevelProgress: LevelProgress = {
      completed: true,
      stars: isNewBest ? stars : existingLevel?.stars || stars,
      highScore: isNewHighScore ? score : existingLevel?.highScore || score,
      bestMoves: !existingLevel || movesRemaining > existingLevel.bestMoves
        ? movesRemaining
        : existingLevel.bestMoves,
    };

    // Calculate star difference for total
    const previousStars = existingLevel?.stars || 0;
    const starDiff = Math.max(0, stars - previousStars);

    // Award coins for stars
    const coinReward = starDiff * 50 + (stars === 3 ? 100 : 0);

    const newProgress: GameProgress = {
      ...progress,
      levels: {
        ...progress.levels,
        [levelId]: newLevelProgress,
      },
      totalStars: progress.totalStars + starDiff,
      currentLevel: Math.max(progress.currentLevel, levelId + 1),
      coins: progress.coins + coinReward,
    };

    await saveProgress(newProgress);
    return { coinReward, isNewBest, isNewHighScore };
  }, [progress, saveProgress]);

  // Check if level is unlocked
  const isLevelUnlocked = useCallback((levelId: number): boolean => {
    if (levelId === 1) return true;
    return progress.levels[levelId - 1]?.completed || false;
  }, [progress]);

  // Get level progress
  const getLevelProgress = useCallback((levelId: number): LevelProgress | undefined => {
    return progress.levels[levelId];
  }, [progress]);

  // Add coins
  const addCoins = useCallback(async (amount: number) => {
    const newProgress = {
      ...progress,
      coins: progress.coins + amount,
    };
    await saveProgress(newProgress);
  }, [progress, saveProgress]);

  // Spend coins
  const spendCoins = useCallback(async (amount: number): Promise<boolean> => {
    if (progress.coins < amount) return false;

    const newProgress = {
      ...progress,
      coins: progress.coins - amount,
    };
    await saveProgress(newProgress);
    return true;
  }, [progress, saveProgress]);

  // Reset progress (for testing)
  const resetProgress = useCallback(async () => {
    await saveProgress(DEFAULT_PROGRESS);
  }, [saveProgress]);

  return {
    progress,
    loading,
    completeLevel,
    isLevelUnlocked,
    getLevelProgress,
    addCoins,
    spendCoins,
    resetProgress,
  };
};

export const useLives = () => {
  const [lives, setLives] = useState<LivesState>(DEFAULT_LIVES);
  const [loading, setLoading] = useState(true);

  // Load lives from storage
  useEffect(() => {
    const loadLives = async () => {
      try {
        const stored = await AsyncStorage.getItem(LIVES_KEY);
        if (stored) {
          const savedLives = JSON.parse(stored) as LivesState;
          // Calculate regenerated lives
          if (savedLives.lastLostAt && savedLives.current < savedLives.max) {
            const now = Date.now();
            const minutesPassed = (now - savedLives.lastLostAt) / (1000 * 60);
            const livesRegenerated = Math.floor(minutesPassed / savedLives.regenerationMinutes);
            const newLives = Math.min(savedLives.max, savedLives.current + livesRegenerated);

            if (newLives !== savedLives.current) {
              const updatedLives = {
                ...savedLives,
                current: newLives,
                lastLostAt: newLives >= savedLives.max ? null : savedLives.lastLostAt,
              };
              await AsyncStorage.setItem(LIVES_KEY, JSON.stringify(updatedLives));
              setLives(updatedLives);
            } else {
              setLives(savedLives);
            }
          } else {
            setLives(savedLives);
          }
        }
      } catch (error) {
        console.error('Failed to load lives:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLives();
  }, []);

  // Save lives to storage
  const saveLives = useCallback(async (newLives: LivesState) => {
    try {
      await AsyncStorage.setItem(LIVES_KEY, JSON.stringify(newLives));
      setLives(newLives);
    } catch (error) {
      console.error('Failed to save lives:', error);
    }
  }, []);

  // Lose a life
  const loseLife = useCallback(async (): Promise<boolean> => {
    if (lives.current <= 0) return false;

    const newLives: LivesState = {
      ...lives,
      current: lives.current - 1,
      lastLostAt: lives.current === lives.max ? Date.now() : lives.lastLostAt,
    };
    await saveLives(newLives);
    return true;
  }, [lives, saveLives]);

  // Add a life (from reward or purchase)
  const addLife = useCallback(async (count: number = 1) => {
    const newCurrent = Math.min(lives.max, lives.current + count);
    const newLives: LivesState = {
      ...lives,
      current: newCurrent,
      lastLostAt: newCurrent >= lives.max ? null : lives.lastLostAt,
    };
    await saveLives(newLives);
  }, [lives, saveLives]);

  // Refill all lives
  const refillLives = useCallback(async () => {
    const newLives: LivesState = {
      ...lives,
      current: lives.max,
      lastLostAt: null,
    };
    await saveLives(newLives);
  }, [lives, saveLives]);

  // Get time until next life regeneration
  const getTimeUntilNextLife = useCallback((): number | null => {
    if (lives.current >= lives.max || !lives.lastLostAt) return null;

    const now = Date.now();
    const minutesPassed = (now - lives.lastLostAt) / (1000 * 60);
    const livesRegenerated = Math.floor(minutesPassed / lives.regenerationMinutes);
    const minutesIntoCurrentRegen = minutesPassed - (livesRegenerated * lives.regenerationMinutes);
    const minutesRemaining = lives.regenerationMinutes - minutesIntoCurrentRegen;

    return Math.max(0, Math.ceil(minutesRemaining));
  }, [lives]);

  // Check if has lives
  const hasLives = lives.current > 0;

  return {
    lives,
    loading,
    loseLife,
    addLife,
    refillLives,
    getTimeUntilNextLife,
    hasLives,
  };
};
