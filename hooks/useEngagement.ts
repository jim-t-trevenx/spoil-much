import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_REWARDS_KEY = '@spoil_much_daily_rewards';
const ACHIEVEMENTS_KEY = '@spoil_much_achievements';
const EVENTS_KEY = '@spoil_much_events';

// ============ DAILY REWARDS ============

export type DailyReward = {
  day: number;
  coins: number;
  lives?: number;
  boosters?: { type: string; count: number }[];
};

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, coins: 100 },
  { day: 2, coins: 150 },
  { day: 3, coins: 200, lives: 1 },
  { day: 4, coins: 250 },
  { day: 5, coins: 300, boosters: [{ type: 'hammer', count: 2 }] },
  { day: 6, coins: 400 },
  { day: 7, coins: 500, lives: 5, boosters: [{ type: 'rainbow_start', count: 1 }] },
];

export type DailyRewardsState = {
  currentStreak: number;
  lastClaimDate: string | null; // ISO date string
  totalDaysClaimed: number;
};

const DEFAULT_DAILY_REWARDS: DailyRewardsState = {
  currentStreak: 0,
  lastClaimDate: null,
  totalDaysClaimed: 0,
};

export const useDailyRewards = () => {
  const [state, setState] = useState<DailyRewardsState>(DEFAULT_DAILY_REWARDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(DAILY_REWARDS_KEY);
        if (stored) {
          setState(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load daily rewards:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = useCallback(async (newState: DailyRewardsState) => {
    try {
      await AsyncStorage.setItem(DAILY_REWARDS_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Failed to save daily rewards:', error);
    }
  }, []);

  const canClaimToday = useCallback((): boolean => {
    if (!state.lastClaimDate) return true;

    const today = new Date().toISOString().split('T')[0];
    return state.lastClaimDate !== today;
  }, [state.lastClaimDate]);

  const getTodayReward = useCallback((): DailyReward => {
    const dayIndex = state.currentStreak % 7;
    return DAILY_REWARDS[dayIndex];
  }, [state.currentStreak]);

  const claimReward = useCallback(async (): Promise<DailyReward | null> => {
    if (!canClaimToday()) return null;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check if streak continues or resets
    const streakContinues = state.lastClaimDate === yesterday;
    const newStreak = streakContinues ? state.currentStreak + 1 : 1;

    const reward = DAILY_REWARDS[(newStreak - 1) % 7];

    const newState: DailyRewardsState = {
      currentStreak: newStreak,
      lastClaimDate: today,
      totalDaysClaimed: state.totalDaysClaimed + 1,
    };

    await save(newState);
    return reward;
  }, [state, canClaimToday, save]);

  return {
    state,
    loading,
    canClaimToday,
    getTodayReward,
    claimReward,
  };
};

// ============ ACHIEVEMENTS ============

export type AchievementId =
  | 'first_match'
  | 'combo_master'
  | 'level_10'
  | 'level_25'
  | 'level_50'
  | 'star_collector_50'
  | 'star_collector_100'
  | 'coin_hoarder'
  | 'rocket_launcher'
  | 'rainbow_king'
  | 'bomb_squad'
  | 'perfect_level'
  | 'speed_demon'
  | 'weekly_player';

export type Achievement = {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  reward: { coins: number; boosters?: { type: string; count: number }[] };
  requirement: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_match',
    name: 'First Steps',
    description: 'Complete your first level',
    icon: '🎯',
    reward: { coins: 50 },
    requirement: 1,
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Get a 5x combo',
    icon: '🔥',
    reward: { coins: 100 },
    requirement: 5,
  },
  {
    id: 'level_10',
    name: 'Getting Started',
    description: 'Complete level 10',
    icon: '⭐',
    reward: { coins: 200 },
    requirement: 10,
  },
  {
    id: 'level_25',
    name: 'Halfway There',
    description: 'Complete level 25',
    icon: '🌟',
    reward: { coins: 500 },
    requirement: 25,
  },
  {
    id: 'level_50',
    name: 'Champion',
    description: 'Complete all 50 levels',
    icon: '👑',
    reward: { coins: 1000, boosters: [{ type: 'rainbow_start', count: 3 }] },
    requirement: 50,
  },
  {
    id: 'star_collector_50',
    name: 'Star Seeker',
    description: 'Collect 50 stars',
    icon: '✨',
    reward: { coins: 300 },
    requirement: 50,
  },
  {
    id: 'star_collector_100',
    name: 'Star Master',
    description: 'Collect 100 stars',
    icon: '💫',
    reward: { coins: 500 },
    requirement: 100,
  },
  {
    id: 'coin_hoarder',
    name: 'Rich Player',
    description: 'Accumulate 5000 coins',
    icon: '💰',
    reward: { coins: 500 },
    requirement: 5000,
  },
  {
    id: 'rocket_launcher',
    name: 'Rocket Launcher',
    description: 'Use 20 rockets',
    icon: '🚀',
    reward: { coins: 150, boosters: [{ type: 'rocket_start', count: 2 }] },
    requirement: 20,
  },
  {
    id: 'rainbow_king',
    name: 'Rainbow King',
    description: 'Use 10 rainbows',
    icon: '🌈',
    reward: { coins: 200, boosters: [{ type: 'rainbow_start', count: 1 }] },
    requirement: 10,
  },
  {
    id: 'bomb_squad',
    name: 'Bomb Squad',
    description: 'Use 15 bombs',
    icon: '💣',
    reward: { coins: 150, boosters: [{ type: 'bomb_start', count: 2 }] },
    requirement: 15,
  },
  {
    id: 'perfect_level',
    name: 'Perfectionist',
    description: 'Get 3 stars on 10 levels',
    icon: '🏆',
    reward: { coins: 300 },
    requirement: 10,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Score 10000 in arcade mode',
    icon: '⚡',
    reward: { coins: 200 },
    requirement: 10000,
  },
  {
    id: 'weekly_player',
    name: 'Dedicated',
    description: 'Play for 7 consecutive days',
    icon: '📅',
    reward: { coins: 500, boosters: [{ type: 'extra_moves', count: 3 }] },
    requirement: 7,
  },
];

export type AchievementProgress = {
  current: number;
  unlocked: boolean;
  claimed: boolean;
};

export type AchievementsState = Record<AchievementId, AchievementProgress>;

const DEFAULT_ACHIEVEMENT_PROGRESS: AchievementProgress = {
  current: 0,
  unlocked: false,
  claimed: false,
};

const DEFAULT_ACHIEVEMENTS: AchievementsState = Object.fromEntries(
  ACHIEVEMENTS.map(a => [a.id, { ...DEFAULT_ACHIEVEMENT_PROGRESS }])
) as AchievementsState;

export const useAchievements = () => {
  const [state, setState] = useState<AchievementsState>(DEFAULT_ACHIEVEMENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
        if (stored) {
          setState({ ...DEFAULT_ACHIEVEMENTS, ...JSON.parse(stored) });
        }
      } catch (error) {
        console.error('Failed to load achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = useCallback(async (newState: AchievementsState) => {
    try {
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  }, []);

  const updateProgress = useCallback(async (id: AchievementId, value: number) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return;

    const current = state[id];
    if (current.unlocked) return; // Already unlocked

    const newProgress = {
      ...current,
      current: value,
      unlocked: value >= achievement.requirement,
    };

    const newState = { ...state, [id]: newProgress };
    await save(newState);

    return newProgress.unlocked;
  }, [state, save]);

  const incrementProgress = useCallback(async (id: AchievementId, amount: number = 1) => {
    const current = state[id];
    return updateProgress(id, current.current + amount);
  }, [state, updateProgress]);

  const claimReward = useCallback(async (id: AchievementId): Promise<Achievement | null> => {
    const current = state[id];
    if (!current.unlocked || current.claimed) return null;

    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return null;

    const newState = {
      ...state,
      [id]: { ...current, claimed: true },
    };
    await save(newState);

    return achievement;
  }, [state, save]);

  const getUnclaimedCount = useCallback((): number => {
    return Object.values(state).filter(p => p.unlocked && !p.claimed).length;
  }, [state]);

  return {
    state,
    loading,
    updateProgress,
    incrementProgress,
    claimReward,
    getUnclaimedCount,
  };
};

// ============ EVENTS ============

export type EventType = 'double_coins' | 'extra_lives' | 'special_level' | 'booster_sale';

export type GameEvent = {
  id: string;
  type: EventType;
  name: string;
  description: string;
  icon: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  multiplier?: number; // For double coins, etc.
  discount?: number;   // For sales
};

// Sample events - in production, these would come from a server
export const SAMPLE_EVENTS: GameEvent[] = [
  {
    id: 'weekend_coins',
    type: 'double_coins',
    name: 'Weekend Bonus',
    description: 'Double coins on all levels!',
    icon: '🪙',
    startDate: '2024-01-01',
    endDate: '2099-12-31', // Always active for demo
    multiplier: 2,
  },
];

export type EventsState = {
  participatedEvents: string[];
  eventProgress: Record<string, number>;
};

const DEFAULT_EVENTS: EventsState = {
  participatedEvents: [],
  eventProgress: {},
};

export const useEvents = () => {
  const [state, setState] = useState<EventsState>(DEFAULT_EVENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(EVENTS_KEY);
        if (stored) {
          setState(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getActiveEvents = useCallback((): GameEvent[] => {
    const now = new Date().toISOString().split('T')[0];
    return SAMPLE_EVENTS.filter(
      event => event.startDate <= now && event.endDate >= now
    );
  }, []);

  const isEventActive = useCallback((eventId: string): boolean => {
    return getActiveEvents().some(e => e.id === eventId);
  }, [getActiveEvents]);

  const getCoinMultiplier = useCallback((): number => {
    const activeEvents = getActiveEvents();
    const doubleCoinEvent = activeEvents.find(e => e.type === 'double_coins');
    return doubleCoinEvent?.multiplier || 1;
  }, [getActiveEvents]);

  return {
    state,
    loading,
    getActiveEvents,
    isEventActive,
    getCoinMultiplier,
  };
};
