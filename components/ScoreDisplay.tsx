import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';

type ScoreDisplayProps = {
  score: number;
  combo: number;
};

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, combo }) => {
  const [displayScore, setDisplayScore] = useState(score);
  const prevScoreRef = useRef(score);
  const scoreScale = useRef(new Animated.Value(1)).current;
  const scoreGlow = useRef(new Animated.Value(0)).current;
  const comboScale = useRef(new Animated.Value(0)).current;
  const comboRotate = useRef(new Animated.Value(0)).current;
  const comboPulse = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const prevComboRef = useRef(combo);

  // Animated score roll-up (slot machine effect)
  useEffect(() => {
    const prevScore = prevScoreRef.current;
    const diff = score - prevScore;

    if (diff > 0) {
      // Determine animation intensity based on score gain
      const isBigGain = diff >= 500;
      const isHugeGain = diff >= 1000;

      // Roll-up animation
      const duration = Math.min(800, Math.max(200, diff / 2));
      const steps = Math.min(30, Math.max(10, Math.floor(diff / 50)));
      const stepDuration = duration / steps;

      let currentStep = 0;
      const rollUp = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        // Easing function for slot machine feel
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.floor(prevScore + diff * eased));

        if (currentStep >= steps) {
          clearInterval(rollUp);
          setDisplayScore(score);
        }
      }, stepDuration);

      // Scale bounce animation
      Animated.sequence([
        Animated.timing(scoreScale, {
          toValue: isHugeGain ? 1.3 : isBigGain ? 1.2 : 1.1,
          duration: 150,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.spring(scoreScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Gold glow pulse for big gains
      if (isBigGain) {
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: isHugeGain ? 1 : 0.7,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }

    prevScoreRef.current = score;
  }, [score]);

  // Combo badge animation
  useEffect(() => {
    if (combo > 1) {
      const isNewCombo = combo !== prevComboRef.current;

      if (isNewCombo) {
        // Zoom-in with bounce
        comboScale.setValue(0);
        comboRotate.setValue(-0.1);

        Animated.parallel([
          Animated.spring(comboScale, {
            toValue: 1,
            friction: 4,
            tension: 150,
            useNativeDriver: true,
          }),
          Animated.spring(comboRotate, {
            toValue: 0,
            friction: 5,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Continuous pulse for high combos
      if (combo >= 3) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(comboPulse, {
              toValue: 1.1,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(comboPulse, {
              toValue: 1,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    } else {
      // Reset when combo ends
      comboPulse.stopAnimation();
      comboPulse.setValue(1);
    }

    prevComboRef.current = combo;
  }, [combo]);

  // Get combo color tier
  const getComboColor = () => {
    if (combo >= 8) return '#FF00FF'; // Purple/magenta for huge combos
    if (combo >= 5) return '#FF4500'; // Orange-red for big combos
    if (combo >= 3) return '#FFD700'; // Gold for medium combos
    return '#FFA500'; // Orange for small combos
  };

  const getComboGlow = () => {
    if (combo >= 8) return '#FF00FF';
    if (combo >= 5) return '#FF4500';
    return '#FFD700';
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/score-bg.gif')}
        style={styles.backgroundGif}
        resizeMode="cover"
      />
      <View style={styles.overlay} />

      {/* Gold glow effect for big score gains */}
      <Animated.View
        style={[
          styles.glowEffect,
          { opacity: glowOpacity },
        ]}
      />

      <View style={styles.content}>
        <Text style={styles.label}>SCORE</Text>

        <Animated.Text
          style={[
            styles.score,
            {
              transform: [{ scale: scoreScale }],
            },
          ]}
        >
          {displayScore.toLocaleString()}
        </Animated.Text>

        {combo > 1 && (
          <Animated.View
            style={[
              styles.comboContainer,
              {
                transform: [
                  { scale: Animated.multiply(comboScale, comboPulse) },
                  {
                    rotate: comboRotate.interpolate({
                      inputRange: [-0.1, 0, 0.1],
                      outputRange: ['-10deg', '0deg', '10deg'],
                    }),
                  },
                ],
                shadowColor: getComboGlow(),
              },
            ]}
          >
            <Text style={[styles.comboText, { color: getComboColor() }]}>
              COMBO
            </Text>
            <Text style={[styles.comboMultiplier, { color: getComboColor() }]}>
              x{combo}
            </Text>
            {combo >= 5 && (
              <View style={styles.fireContainer}>
                <Text style={styles.fireEmoji}>🔥</Text>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 20,
    alignSelf: 'center',
  },
  backgroundGif: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  glowEffect: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: '#FFD700',
    borderRadius: 30,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    color: '#AAA',
    fontWeight: '600',
    letterSpacing: 3,
  },
  score: {
    fontSize: 48,
    color: '#FFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    fontVariant: ['tabular-nums'],
  },
  comboContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  comboText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginRight: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  comboMultiplier: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  fireContainer: {
    marginLeft: 4,
  },
  fireEmoji: {
    fontSize: 18,
  },
});
