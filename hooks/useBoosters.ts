import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BoosterInventory,
  DEFAULT_INVENTORY,
  PreGameBoosterType,
  InGamePowerUpType,
  BOOSTER_INFO,
} from '../types/boosters';

const BOOSTERS_KEY = '@spoil_much_boosters';

export const useBoosters = () => {
  const [inventory, setInventory] = useState<BoosterInventory>(DEFAULT_INVENTORY);
  const [loading, setLoading] = useState(true);

  // Load inventory from storage
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const stored = await AsyncStorage.getItem(BOOSTERS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge with defaults to handle new booster types
          setInventory({ ...DEFAULT_INVENTORY, ...parsed });
        }
      } catch (error) {
        console.error('Failed to load boosters:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInventory();
  }, []);

  // Save inventory to storage
  const saveInventory = useCallback(async (newInventory: BoosterInventory) => {
    try {
      await AsyncStorage.setItem(BOOSTERS_KEY, JSON.stringify(newInventory));
      setInventory(newInventory);
    } catch (error) {
      console.error('Failed to save boosters:', error);
    }
  }, []);

  // Use a booster (decrement count)
  const useBooster = useCallback(async (
    type: PreGameBoosterType | InGamePowerUpType
  ): Promise<boolean> => {
    if (inventory[type] <= 0) return false;

    const newInventory = {
      ...inventory,
      [type]: inventory[type] - 1,
    };
    await saveInventory(newInventory);
    return true;
  }, [inventory, saveInventory]);

  // Add boosters (from purchase or reward)
  const addBoosters = useCallback(async (
    type: PreGameBoosterType | InGamePowerUpType,
    count: number = 1
  ) => {
    const newInventory = {
      ...inventory,
      [type]: inventory[type] + count,
    };
    await saveInventory(newInventory);
  }, [inventory, saveInventory]);

  // Check if booster is available
  const hasBooster = useCallback((
    type: PreGameBoosterType | InGamePowerUpType
  ): boolean => {
    return inventory[type] > 0;
  }, [inventory]);

  // Get booster count
  const getBoosterCount = useCallback((
    type: PreGameBoosterType | InGamePowerUpType
  ): number => {
    return inventory[type];
  }, [inventory]);

  // Purchase booster with coins (returns cost or 0 if failed)
  const getBoosterCost = (type: PreGameBoosterType | InGamePowerUpType): number => {
    return BOOSTER_INFO[type].cost;
  };

  return {
    inventory,
    loading,
    useBooster,
    addBoosters,
    hasBooster,
    getBoosterCount,
    getBoosterCost,
  };
};

// Selected boosters for a level
export type SelectedBoosters = {
  extraMoves: boolean;
  rocketStart: boolean;
  bombStart: boolean;
  rainbowStart: boolean;
};

export const DEFAULT_SELECTED_BOOSTERS: SelectedBoosters = {
  extraMoves: false,
  rocketStart: false,
  bombStart: false,
  rainbowStart: false,
};
