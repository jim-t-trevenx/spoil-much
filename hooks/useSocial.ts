import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCIAL_KEY = '@spoil_much_social';
const FRIENDS_KEY = '@spoil_much_friends';

// ============ PLAYER PROFILE ============

export type PlayerProfile = {
  id: string;
  name: string;
  avatar: string;
  level: number;
  totalStars: number;
  totalScore: number;
  createdAt: string;
};

const generatePlayerId = (): string => {
  return 'player_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const DEFAULT_AVATARS = ['👤', '🦊', '🐱', '🐶', '🦁', '🐼', '🐨', '🐸', '🦉', '🦋'];

const DEFAULT_PROFILE: PlayerProfile = {
  id: generatePlayerId(),
  name: 'Player',
  avatar: '👤',
  level: 1,
  totalStars: 0,
  totalScore: 0,
  createdAt: new Date().toISOString(),
};

export const useProfile = () => {
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(SOCIAL_KEY);
        if (stored) {
          setProfile(JSON.parse(stored));
        } else {
          // Initialize new profile
          await AsyncStorage.setItem(SOCIAL_KEY, JSON.stringify(DEFAULT_PROFILE));
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = useCallback(async (newProfile: PlayerProfile) => {
    try {
      await AsyncStorage.setItem(SOCIAL_KEY, JSON.stringify(newProfile));
      setProfile(newProfile);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  }, []);

  const updateName = useCallback(async (name: string) => {
    const newProfile = { ...profile, name: name.trim() || 'Player' };
    await save(newProfile);
  }, [profile, save]);

  const updateAvatar = useCallback(async (avatar: string) => {
    const newProfile = { ...profile, avatar };
    await save(newProfile);
  }, [profile, save]);

  const updateStats = useCallback(async (stars: number, score: number, level: number) => {
    const newProfile = {
      ...profile,
      totalStars: stars,
      totalScore: Math.max(profile.totalScore, score),
      level,
    };
    await save(newProfile);
  }, [profile, save]);

  return {
    profile,
    loading,
    updateName,
    updateAvatar,
    updateStats,
    availableAvatars: DEFAULT_AVATARS,
  };
};

// ============ FRIENDS ============

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  level: number;
  totalStars: number;
  lastActive: string;
};

// Mock friends for demo purposes
// In production, this would come from a server
const MOCK_FRIENDS: Friend[] = [
  { id: 'bot1', name: 'Alice', avatar: '🦊', level: 35, totalStars: 95, lastActive: '2h ago' },
  { id: 'bot2', name: 'Bob', avatar: '🐱', level: 28, totalStars: 78, lastActive: '5h ago' },
  { id: 'bot3', name: 'Charlie', avatar: '🦁', level: 42, totalStars: 120, lastActive: '1d ago' },
  { id: 'bot4', name: 'Diana', avatar: '🐼', level: 50, totalStars: 150, lastActive: 'Online' },
  { id: 'bot5', name: 'Eve', avatar: '🦋', level: 15, totalStars: 40, lastActive: '3d ago' },
];

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [loading, setLoading] = useState(false);

  // In production, this would fetch from a server
  const refreshFriends = useCallback(async () => {
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setFriends(MOCK_FRIENDS);
    setLoading(false);
  }, []);

  const getFriendLeaderboard = useCallback((): Friend[] => {
    return [...friends].sort((a, b) => b.totalStars - a.totalStars);
  }, [friends]);

  return {
    friends,
    loading,
    refreshFriends,
    getFriendLeaderboard,
  };
};

// ============ GLOBAL LEADERBOARD ============

export type LeaderboardEntry = {
  rank: number;
  playerId: string;
  name: string;
  avatar: string;
  score: number;
  level: number;
};

// Mock global leaderboard
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, playerId: 'top1', name: 'MasterMatch', avatar: '👑', score: 1250000, level: 50 },
  { rank: 2, playerId: 'top2', name: 'PuzzleKing', avatar: '🏆', score: 1100000, level: 50 },
  { rank: 3, playerId: 'top3', name: 'StarHunter', avatar: '⭐', score: 980000, level: 48 },
  { rank: 4, playerId: 'top4', name: 'ComboQueen', avatar: '🔥', score: 850000, level: 45 },
  { rank: 5, playerId: 'top5', name: 'BlockBuster', avatar: '💎', score: 720000, level: 42 },
  { rank: 6, playerId: 'top6', name: 'MatchPro', avatar: '🎯', score: 650000, level: 40 },
  { rank: 7, playerId: 'top7', name: 'SwipeMaster', avatar: '✨', score: 580000, level: 38 },
  { rank: 8, playerId: 'top8', name: 'RainbowRider', avatar: '🌈', score: 520000, level: 35 },
  { rank: 9, playerId: 'top9', name: 'RocketMan', avatar: '🚀', score: 480000, level: 33 },
  { rank: 10, playerId: 'top10', name: 'BombSquad', avatar: '💣', score: 420000, level: 30 },
];

export type LeaderboardType = 'global' | 'friends' | 'weekly';

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [loading, setLoading] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('global');

  const fetchLeaderboard = useCallback(async (type: LeaderboardType = 'global') => {
    setLoading(true);
    setLeaderboardType(type);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, fetch from server based on type
    setLeaderboard(MOCK_LEADERBOARD);
    setLoading(false);
  }, []);

  const getPlayerRank = useCallback((playerId: string): number | null => {
    const entry = leaderboard.find(e => e.playerId === playerId);
    return entry?.rank || null;
  }, [leaderboard]);

  return {
    leaderboard,
    loading,
    leaderboardType,
    fetchLeaderboard,
    getPlayerRank,
  };
};

// ============ SHARE & INVITE ============

export type ShareContent = {
  title: string;
  message: string;
  url?: string;
};

export const useShare = () => {
  const shareScore = useCallback(async (score: number, level: number): Promise<boolean> => {
    const content: ShareContent = {
      title: 'Spoil Much',
      message: `I just scored ${score.toLocaleString()} on level ${level} in Spoil Much! Can you beat me?`,
      url: 'https://example.com/spoilmuch', // Replace with actual app URL
    };

    // In production, use react-native Share API:
    // import { Share } from 'react-native';
    // await Share.share({ message: content.message, title: content.title, url: content.url });

    console.log('[Share]', content);
    return true;
  }, []);

  const inviteFriend = useCallback(async (): Promise<boolean> => {
    const content: ShareContent = {
      title: 'Join me in Spoil Much!',
      message: "I'm playing Spoil Much, a fun match-3 puzzle game! Join me and let's compete!",
      url: 'https://example.com/spoilmuch',
    };

    console.log('[Invite]', content);
    return true;
  }, []);

  const shareAchievement = useCallback(async (achievementName: string): Promise<boolean> => {
    const content: ShareContent = {
      title: 'Achievement Unlocked!',
      message: `I just unlocked "${achievementName}" in Spoil Much!`,
    };

    console.log('[Share Achievement]', content);
    return true;
  }, []);

  return {
    shareScore,
    inviteFriend,
    shareAchievement,
  };
};
