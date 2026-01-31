import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============ SCREEN SHAKE ============

type ScreenShakeProps = {
  children: React.ReactNode;
  trigger: number; // Increment to trigger shake
  intensity?: 'light' | 'medium' | 'heavy';
};

export const ScreenShake: React.FC<ScreenShakeProps> = ({
  children,
  trigger,
  intensity = 'medium',
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger !== prevTrigger.current && trigger > 0) {
      const maxOffset = intensity === 'heavy' ? 12 : intensity === 'medium' ? 6 : 3;
      const duration = intensity === 'heavy' ? 400 : intensity === 'medium' ? 300 : 200;
      const shakes = intensity === 'heavy' ? 6 : intensity === 'medium' ? 4 : 3;

      const shakeSequence: Animated.CompositeAnimation[] = [];

      for (let i = 0; i < shakes; i++) {
        const damping = 1 - i / shakes;
        const offset = maxOffset * damping;

        shakeSequence.push(
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: (Math.random() - 0.5) * offset * 2,
              duration: duration / shakes / 2,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: (Math.random() - 0.5) * offset * 2,
              duration: duration / shakes / 2,
              useNativeDriver: true,
            }),
          ])
        );
      }

      // Return to center
      shakeSequence.push(
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            friction: 5,
            useNativeDriver: true,
          }),
        ])
      );

      Animated.sequence(shakeSequence).start();
    }
    prevTrigger.current = trigger;
  }, [trigger, intensity]);

  return (
    <Animated.View
      style={[
        styles.shakeContainer,
        {
          transform: [{ translateX }, { translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ============ SCREEN FLASH ============

type ScreenFlashProps = {
  trigger: number;
  color?: string;
  duration?: number;
};

export const ScreenFlash: React.FC<ScreenFlashProps> = ({
  trigger,
  color = '#FFFFFF',
  duration = 200,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger !== prevTrigger.current && trigger > 0) {
      opacity.setValue(0.8);

      Animated.timing(opacity, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
    prevTrigger.current = trigger;
  }, [trigger, duration]);

  return (
    <Animated.View
      style={[
        styles.flashOverlay,
        {
          backgroundColor: color,
          opacity,
        },
      ]}
      pointerEvents="none"
    />
  );
};

// ============ VIGNETTE PULSE ============

type VignettePulseProps = {
  active: boolean;
  color?: string;
};

export const VignettePulse: React.FC<VignettePulseProps> = ({
  active,
  color = '#FFD700',
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.05,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0.1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      opacity.stopAnimation();
      scale.stopAnimation();
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      opacity.stopAnimation();
      scale.stopAnimation();
    };
  }, [active]);

  return (
    <Animated.View
      style={[
        styles.vignetteOverlay,
        {
          borderColor: color,
          opacity,
          transform: [{ scale }],
        },
      ]}
      pointerEvents="none"
    />
  );
};

// ============ COMBO FIRE BORDER ============

type ComboFireBorderProps = {
  combo: number;
};

export const ComboFireBorder: React.FC<ComboFireBorderProps> = ({ combo }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (combo >= 5) {
      setActive(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      setActive(false);
      pulse.stopAnimation();
    }
  }, [combo]);

  if (!active) return null;

  const getColor = () => {
    if (combo >= 10) return '#FF00FF'; // Magenta
    if (combo >= 8) return '#FF4500'; // Orange-red
    if (combo >= 5) return '#FFD700'; // Gold
    return '#FFA500'; // Orange
  };

  return (
    <Animated.View
      style={[
        styles.fireBorder,
        {
          borderColor: getColor(),
          opacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.8],
          }),
          shadowColor: getColor(),
        },
      ]}
      pointerEvents="none"
    />
  );
};

// ============ SCREEN EFFECTS HOOK ============

export const useScreenEffects = () => {
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [shakeIntensity, setShakeIntensity] = useState<'light' | 'medium' | 'heavy'>('medium');
  const [flashTrigger, setFlashTrigger] = useState(0);
  const [flashColor, setFlashColor] = useState('#FFFFFF');

  const triggerShake = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    setShakeIntensity(intensity);
    setShakeTrigger(prev => prev + 1);
  }, []);

  const triggerFlash = useCallback((color: string = '#FFFFFF') => {
    setFlashColor(color);
    setFlashTrigger(prev => prev + 1);
  }, []);

  // Convenience methods
  const triggerBombEffect = useCallback(() => {
    triggerShake('heavy');
    triggerFlash('#FF4500');
  }, [triggerShake, triggerFlash]);

  const triggerRainbowEffect = useCallback(() => {
    triggerShake('medium');
    triggerFlash('#FFD700');
  }, [triggerShake, triggerFlash]);

  const triggerComboEffect = useCallback((combo: number) => {
    if (combo >= 8) {
      triggerShake('medium');
      triggerFlash('#FF00FF');
    } else if (combo >= 5) {
      triggerShake('light');
      triggerFlash('#FFD700');
    }
  }, [triggerShake, triggerFlash]);

  return {
    shakeTrigger,
    shakeIntensity,
    flashTrigger,
    flashColor,
    triggerShake,
    triggerFlash,
    triggerBombEffect,
    triggerRainbowEffect,
    triggerComboEffect,
  };
};

const styles = StyleSheet.create({
  shakeContainer: {
    flex: 1,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
  },
  vignetteOverlay: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    borderWidth: 80,
    borderRadius: 100,
    zIndex: 100,
  },
  fireBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 4,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    zIndex: 50,
  },
});
