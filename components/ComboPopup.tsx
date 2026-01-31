import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

export type PopupType = 'score' | 'combo' | 'special';

export type PopupData = {
  id: string;
  type: PopupType;
  value: number | string;
  x: number;
  y: number;
  color?: string;
};

type ComboPopupItemProps = {
  popup: PopupData;
  onComplete: (id: string) => void;
};

const ComboPopupItem: React.FC<ComboPopupItemProps> = ({ popup, onComplete }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Random horizontal drift
    const xDrift = (Math.random() - 0.5) * 40;

    Animated.parallel([
      // Float up
      Animated.timing(translateY, {
        toValue: -120,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Horizontal drift
      Animated.timing(translateX, {
        toValue: xDrift,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Scale: pop in then shrink
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.3,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 600,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Opacity: fade in then out
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          delay: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Slight rotation wobble
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: (Math.random() - 0.5) * 0.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete(popup.id);
    });
  }, []);

  const getPopupStyle = () => {
    switch (popup.type) {
      case 'combo':
        return styles.comboPopup;
      case 'special':
        return styles.specialPopup;
      default:
        return styles.scorePopup;
    }
  };

  const getTextStyle = () => {
    switch (popup.type) {
      case 'combo':
        return [styles.comboText, { color: popup.color || '#FFD700' }];
      case 'special':
        return [styles.specialText, { color: popup.color || '#FF00FF' }];
      default:
        return [styles.scoreText, { color: popup.color || '#FFFFFF' }];
    }
  };

  const getText = () => {
    if (popup.type === 'score') {
      return `+${typeof popup.value === 'number' ? popup.value.toLocaleString() : popup.value}`;
    }
    if (popup.type === 'combo') {
      return `x${popup.value}`;
    }
    return popup.value;
  };

  return (
    <Animated.View
      style={[
        styles.popupContainer,
        getPopupStyle(),
        {
          left: popup.x,
          top: popup.y,
          transform: [
            { translateX },
            { translateY },
            { scale },
            {
              rotate: rotate.interpolate({
                inputRange: [-0.2, 0, 0.2],
                outputRange: ['-12deg', '0deg', '12deg'],
              }),
            },
          ],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={getTextStyle()}>{getText()}</Text>
    </Animated.View>
  );
};

type ComboPopupProps = {
  popups: PopupData[];
  onPopupComplete: (id: string) => void;
};

export const ComboPopup: React.FC<ComboPopupProps> = ({ popups, onPopupComplete }) => {
  return (
    <View style={styles.container} pointerEvents="none">
      {popups.map(popup => (
        <ComboPopupItem
          key={popup.id}
          popup={popup}
          onComplete={onPopupComplete}
        />
      ))}
    </View>
  );
};

// Hook to manage popups
export const useComboPopups = () => {
  const [popups, setPopups] = React.useState<PopupData[]>([]);
  const idCounterRef = React.useRef(0);

  const addPopup = React.useCallback((
    type: PopupType,
    value: number | string,
    x: number,
    y: number,
    color?: string
  ) => {
    const id = `popup_${idCounterRef.current++}`;
    setPopups(prev => [...prev, { id, type, value, x, y, color }]);
    return id;
  }, []);

  const removePopup = React.useCallback((id: string) => {
    setPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  const addScorePopup = React.useCallback((score: number, x: number, y: number) => {
    // Color based on score value
    let color = '#FFFFFF';
    if (score >= 500) color = '#FFD700'; // Gold
    if (score >= 1000) color = '#FF4500'; // Orange-red
    if (score >= 2000) color = '#FF00FF'; // Magenta

    return addPopup('score', score, x, y, color);
  }, [addPopup]);

  const addComboPopup = React.useCallback((combo: number, x: number, y: number) => {
    let color = '#FFA500'; // Orange
    if (combo >= 3) color = '#FFD700'; // Gold
    if (combo >= 5) color = '#FF4500'; // Orange-red
    if (combo >= 8) color = '#FF00FF'; // Magenta

    return addPopup('combo', combo, x, y, color);
  }, [addPopup]);

  const addSpecialPopup = React.useCallback((text: string, x: number, y: number, color?: string) => {
    return addPopup('special', text, x, y, color || '#00FFFF');
  }, [addPopup]);

  return {
    popups,
    addPopup,
    removePopup,
    addScorePopup,
    addComboPopup,
    addSpecialPopup,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  popupContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  scorePopup: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  comboPopup: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.6)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  specialPopup: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 255, 0.6)',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  comboText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  specialText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
