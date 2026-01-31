import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Prize, WHEEL_PRIZES } from '../../hooks/useBonusGame';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_WIDTH - 80, 320);
const SEGMENT_COUNT = 8;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

type SpinWheelProps = {
  onComplete: (prize: Prize) => void;
  resultIndex: number;
};

const SEGMENT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#F38181', // Coral
  '#AA96DA', // Purple
  '#FFD700', // Gold (jackpot)
  '#74B9FF', // Blue
];

export const SpinWheel: React.FC<SpinWheelProps> = ({ onComplete, resultIndex }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonGlow = useRef(new Animated.Value(0)).current;
  const lightsAnim = useRef(new Animated.Value(0)).current;

  // Button pulse animation
  useEffect(() => {
    if (!isSpinning && !hasSpun) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScale, {
            toValue: 1.1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(buttonScale, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonGlow, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(buttonGlow, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isSpinning, hasSpun]);

  // Flashing lights animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(lightsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const handleSpin = () => {
    if (isSpinning || hasSpun) return;

    setIsSpinning(true);
    buttonScale.stopAnimation();
    buttonGlow.stopAnimation();

    // Calculate final rotation to land on result
    // The wheel spins multiple times plus lands on the target segment
    const baseSpins = 5; // Number of full rotations
    const targetAngle = (SEGMENT_COUNT - resultIndex - 0.5) * SEGMENT_ANGLE;
    const finalRotation = baseSpins * 360 + targetAngle;

    Animated.timing(rotation, {
      toValue: finalRotation,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      setHasSpun(true);

      // Delay before showing result
      setTimeout(() => {
        onComplete(WHEEL_PRIZES[resultIndex]);
      }, 500);
    });
  };

  const rotationDeg = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Outer ring with lights */}
      <View style={styles.outerRing}>
        {Array.from({ length: 16 }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.light,
              {
                transform: [
                  { rotate: `${i * 22.5}deg` },
                  { translateY: -WHEEL_SIZE / 2 - 15 },
                ],
                opacity: lightsAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: i % 2 === 0 ? [1, 0.3, 1] : [0.3, 1, 0.3],
                }),
              },
            ]}
          />
        ))}
      </View>

      {/* Wheel */}
      <Animated.View
        style={[
          styles.wheel,
          {
            transform: [{ rotate: rotationDeg }],
          },
        ]}
      >
        {WHEEL_PRIZES.map((prize, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                transform: [{ rotate: `${index * SEGMENT_ANGLE}deg` }],
              },
            ]}
          >
            <View
              style={[
                styles.segmentInner,
                { backgroundColor: SEGMENT_COLORS[index] },
              ]}
            >
              <Text style={styles.segmentIcon}>{prize.icon}</Text>
              <Text style={styles.segmentLabel}>{prize.label}</Text>
            </View>
          </View>
        ))}

        {/* Center circle */}
        <View style={styles.centerCircle}>
          <View style={styles.centerInner} />
        </View>
      </Animated.View>

      {/* Pointer */}
      <View style={styles.pointerContainer}>
        <View style={styles.pointer} />
      </View>

      {/* Spin Button */}
      {!hasSpun && (
        <Animated.View
          style={[
            styles.spinButtonContainer,
            {
              transform: [{ scale: buttonScale }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.spinButtonGlow,
              {
                opacity: buttonGlow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
              },
            ]}
          />
          <TouchableOpacity
            style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
            onPress={handleSpin}
            disabled={isSpinning}
          >
            <Text style={styles.spinButtonText}>
              {isSpinning ? 'SPINNING...' : 'SPIN!'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: WHEEL_SIZE + 40,
    height: WHEEL_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    backgroundColor: '#1a1a2e',
    borderWidth: 8,
    borderColor: '#FFD700',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  segment: {
    position: 'absolute',
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: 'center',
  },
  segmentInner: {
    width: 0,
    height: 0,
    borderLeftWidth: WHEEL_SIZE / 2 - 8,
    borderRightWidth: WHEEL_SIZE / 2 - 8,
    borderBottomWidth: WHEEL_SIZE / 2 - 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignItems: 'center',
    paddingTop: 15,
  },
  segmentIcon: {
    fontSize: 24,
    marginTop: 20,
  },
  segmentLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 2,
  },
  centerCircle: {
    position: 'absolute',
    top: WHEEL_SIZE / 2 - 30,
    left: WHEEL_SIZE / 2 - 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  centerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  pointerContainer: {
    position: 'absolute',
    top: -10,
    alignItems: 'center',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderTopWidth: 35,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  spinButtonContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  spinButtonGlow: {
    position: 'absolute',
    width: 160,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  spinButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  spinButtonDisabled: {
    backgroundColor: '#888',
  },
  spinButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
});
