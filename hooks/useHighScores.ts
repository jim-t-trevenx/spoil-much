import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'spoil_much_high_scores';
const MAX_SCORES = 5;

export type HighScore = {
  score: number;
  date: string;
};

export const useHighScores = () => {
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load high scores on mount
  useEffect(() => {
    loadHighScores();
  }, []);

  const loadHighScores = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHighScores(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load high scores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveHighScore = useCallback(async (score: number): Promise<boolean> => {
    try {
      const newScore: HighScore = {
        score,
        date: new Date().toLocaleDateString(),
      };

      // Check if this score makes the top 5
      const allScores = [...highScores, newScore];
      allScores.sort((a, b) => b.score - a.score);
      const topScores = allScores.slice(0, MAX_SCORES);

      // Check if the new score made it into top 5
      const isNewHighScore = topScores.some(
        (s) => s.score === score && s.date === newScore.date
      );

      if (isNewHighScore) {
        setHighScores(topScores);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(topScores));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to save high score:', error);
      return false;
    }
  }, [highScores]);

  const clearHighScores = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setHighScores([]);
    } catch (error) {
      console.error('Failed to clear high scores:', error);
    }
  }, []);

  const isHighScore = useCallback((score: number): boolean => {
    if (highScores.length < MAX_SCORES) return score > 0;
    return score > highScores[highScores.length - 1].score;
  }, [highScores]);

  return {
    highScores,
    isLoading,
    saveHighScore,
    clearHighScores,
    isHighScore,
  };
};
