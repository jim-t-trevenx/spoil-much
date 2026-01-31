import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sound types used in the game
export type SoundEffect =
  | 'tap'
  | 'swap'
  | 'match'
  | 'combo'
  | 'rocket'
  | 'bomb'
  | 'rainbow'
  | 'propeller'
  | 'level_complete'
  | 'level_fail'
  | 'star_earned'
  | 'coin_earned'
  | 'booster_used'
  | 'obstacle_break'
  | 'ui_button';

export type MusicTrack =
  | 'menu'
  | 'gameplay'
  | 'victory'
  | 'boss';

const SOUND_SETTINGS_KEY = '@spoil_much_sound';

export type SoundSettings = {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;  // 0-1
  musicVolume: number;  // 0-1
};

const DEFAULT_SETTINGS: SoundSettings = {
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 1.0,
  musicVolume: 0.7,
};

/**
 * Sound management hook
 *
 * Note: This is a stub implementation. In production, you would:
 * 1. Install expo-av: npx expo install expo-av
 * 2. Add actual audio files to assets/sounds/
 * 3. Implement Audio.Sound loading and playback
 *
 * Example implementation with expo-av:
 * ```
 * import { Audio } from 'expo-av';
 *
 * const sounds: Record<SoundEffect, Audio.Sound | null> = {};
 *
 * const loadSounds = async () => {
 *   sounds.tap = await Audio.Sound.createAsync(require('../assets/sounds/tap.mp3'));
 *   // ... load other sounds
 * };
 *
 * const playSound = async (effect: SoundEffect) => {
 *   if (sounds[effect]) {
 *     await sounds[effect].replayAsync();
 *   }
 * };
 * ```
 */
export const useSound = () => {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [currentMusic, setCurrentMusic] = useState<MusicTrack | null>(null);

  // Load settings from storage
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
        if (stored) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        }
      } catch (error) {
        console.error('Failed to load sound settings:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Save settings to storage
  const saveSettings = useCallback(async (newSettings: SoundSettings) => {
    try {
      await AsyncStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save sound settings:', error);
    }
  }, []);

  // Toggle sound effects
  const toggleSound = useCallback(async () => {
    const newSettings = { ...settings, soundEnabled: !settings.soundEnabled };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Toggle music
  const toggleMusic = useCallback(async () => {
    const newSettings = { ...settings, musicEnabled: !settings.musicEnabled };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Set sound volume
  const setSoundVolume = useCallback(async (volume: number) => {
    const newSettings = { ...settings, soundVolume: Math.max(0, Math.min(1, volume)) };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Set music volume
  const setMusicVolume = useCallback(async (volume: number) => {
    const newSettings = { ...settings, musicVolume: Math.max(0, Math.min(1, volume)) };
    await saveSettings(newSettings);
  }, [settings, saveSettings]);

  /**
   * Play a sound effect
   * Stub implementation - logs to console
   * Replace with actual audio playback in production
   */
  const playSound = useCallback((effect: SoundEffect) => {
    if (!settings.soundEnabled) return;

    // In production, this would play the actual sound file
    // console.log(`[Sound] Playing: ${effect}`);

    // Haptic feedback for certain sounds (optional enhancement)
    // import * as Haptics from 'expo-haptics';
    // if (effect === 'match' || effect === 'combo') {
    //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // }
  }, [settings.soundEnabled]);

  /**
   * Play background music
   * Stub implementation - logs to console
   * Replace with actual audio playback in production
   */
  const playMusic = useCallback((track: MusicTrack) => {
    if (!settings.musicEnabled) return;

    // Stop current music first
    if (currentMusic) {
      // In production: await currentMusicSound.stopAsync();
    }

    setCurrentMusic(track);
    // In production: load and play the music track
    // console.log(`[Music] Playing: ${track}`);
  }, [settings.musicEnabled, currentMusic]);

  /**
   * Stop background music
   */
  const stopMusic = useCallback(() => {
    setCurrentMusic(null);
    // In production: await currentMusicSound.stopAsync();
  }, []);

  return {
    settings,
    loading,
    toggleSound,
    toggleMusic,
    setSoundVolume,
    setMusicVolume,
    playSound,
    playMusic,
    stopMusic,
    currentMusic,
  };
};
