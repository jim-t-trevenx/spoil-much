import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TUTORIAL_KEY = '@spoil_much_tutorial';

export type TutorialStep =
  | 'welcome'
  | 'swipe_intro'
  | 'match_3'
  | 'special_4'
  | 'special_5'
  | 'combo'
  | 'objectives'
  | 'obstacles'
  | 'boosters'
  | 'complete';

export type TutorialContent = {
  step: TutorialStep;
  title: string;
  message: string;
  icon: string;
  highlightArea?: 'board' | 'objectives' | 'boosters' | 'moves' | 'score';
  showArrow?: boolean;
  arrowDirection?: 'up' | 'down' | 'left' | 'right';
  waitForAction?: 'tap' | 'swipe' | 'match';
};

export const TUTORIAL_STEPS: TutorialContent[] = [
  {
    step: 'welcome',
    title: 'Welcome!',
    message: "Let's learn how to play Spoil Much! Tap to continue.",
    icon: '👋',
  },
  {
    step: 'swipe_intro',
    title: 'Swipe to Match',
    message: 'Swipe blocks to swap them with their neighbors.',
    icon: '👆',
    highlightArea: 'board',
    showArrow: true,
    arrowDirection: 'right',
    waitForAction: 'swipe',
  },
  {
    step: 'match_3',
    title: 'Match 3',
    message: 'Match 3 or more blocks of the same color to clear them!',
    icon: '✨',
    highlightArea: 'board',
    waitForAction: 'match',
  },
  {
    step: 'special_4',
    title: 'Rockets!',
    message: 'Match 4 blocks to create a rocket that clears an entire row or column!',
    icon: '🚀',
  },
  {
    step: 'special_5',
    title: 'Rainbow Power!',
    message: 'Match 5+ blocks or create an L/T shape to get a rainbow that clears all blocks of one color!',
    icon: '🌈',
  },
  {
    step: 'combo',
    title: 'Combos!',
    message: 'Chain matches together for combo multipliers and bigger scores!',
    icon: '🔥',
  },
  {
    step: 'objectives',
    title: 'Complete Objectives',
    message: 'Each level has objectives you need to complete. Check them at the top!',
    icon: '🎯',
    highlightArea: 'objectives',
  },
  {
    step: 'obstacles',
    title: 'Obstacles',
    message: 'Some levels have obstacles like boxes, ice, and chains. Match next to them to clear!',
    icon: '📦',
  },
  {
    step: 'boosters',
    title: 'Use Boosters',
    message: 'Select boosters before starting a level for extra help!',
    icon: '⚡',
    highlightArea: 'boosters',
  },
  {
    step: 'complete',
    title: "You're Ready!",
    message: 'Good luck and have fun! Get 3 stars on each level for bonus rewards!',
    icon: '🎉',
  },
];

export type TutorialState = {
  completed: boolean;
  currentStep: number;
  stepsShown: TutorialStep[];
  skipped: boolean;
};

const DEFAULT_TUTORIAL: TutorialState = {
  completed: false,
  currentStep: 0,
  stepsShown: [],
  skipped: false,
};

export const useTutorial = () => {
  const [state, setState] = useState<TutorialState>(DEFAULT_TUTORIAL);
  const [loading, setLoading] = useState(true);
  const [showingTutorial, setShowingTutorial] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(TUTORIAL_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setState(parsed);
          // Show tutorial on first load if not completed
          if (!parsed.completed && !parsed.skipped) {
            setShowingTutorial(true);
          }
        } else {
          // First time player
          setShowingTutorial(true);
        }
      } catch (error) {
        console.error('Failed to load tutorial:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = useCallback(async (newState: TutorialState) => {
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, JSON.stringify(newState));
      setState(newState);
    } catch (error) {
      console.error('Failed to save tutorial:', error);
    }
  }, []);

  const getCurrentStep = useCallback((): TutorialContent | null => {
    if (state.completed || state.skipped) return null;
    if (state.currentStep >= TUTORIAL_STEPS.length) return null;
    return TUTORIAL_STEPS[state.currentStep];
  }, [state]);

  const nextStep = useCallback(async () => {
    const nextStepIndex = state.currentStep + 1;
    const currentStepContent = TUTORIAL_STEPS[state.currentStep];

    if (nextStepIndex >= TUTORIAL_STEPS.length) {
      // Tutorial complete
      const newState: TutorialState = {
        ...state,
        completed: true,
        currentStep: nextStepIndex,
        stepsShown: [...state.stepsShown, currentStepContent.step],
      };
      await save(newState);
      setShowingTutorial(false);
    } else {
      const newState: TutorialState = {
        ...state,
        currentStep: nextStepIndex,
        stepsShown: [...state.stepsShown, currentStepContent.step],
      };
      await save(newState);
    }
  }, [state, save]);

  const skipTutorial = useCallback(async () => {
    const newState: TutorialState = {
      ...state,
      skipped: true,
    };
    await save(newState);
    setShowingTutorial(false);
  }, [state, save]);

  const resetTutorial = useCallback(async () => {
    await save(DEFAULT_TUTORIAL);
    setShowingTutorial(true);
  }, [save]);

  const startTutorial = useCallback(() => {
    setShowingTutorial(true);
  }, []);

  const dismissTutorial = useCallback(() => {
    setShowingTutorial(false);
  }, []);

  const hasCompletedStep = useCallback((step: TutorialStep): boolean => {
    return state.stepsShown.includes(step);
  }, [state.stepsShown]);

  return {
    state,
    loading,
    showingTutorial,
    getCurrentStep,
    nextStep,
    skipTutorial,
    resetTutorial,
    startTutorial,
    dismissTutorial,
    hasCompletedStep,
  };
};
