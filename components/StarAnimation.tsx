import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type StarState = {
  scale: Animated.Value;
  opacity: Animated.Value;
  translateX: Animated.Value;
  translateY: Animated.Value;
  rotation: Animated.Value;
  glowOpacity: Animated.Value;
};

type SparkleState = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  angle: number;
};

const createSparkles = (count: number): SparkleState[] => {
  const sparkles: SparkleState[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    sparkles.push({
      id: i,
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      angle,
    });
  }
  return sparkles;
};

type StarProps = {
  index: number;
  filled: boolean;
  animate: boolean;
  size?: number;
  delay?: number;
  startX?: number;
  startY?: number;
  targetX?: number;
  targetY?: number;
  onAnimationComplete?: () => void;
};

const AnimatedStar: React.FC<StarProps> = ({
  index,
  filled,
  animate,
  size = 40,
  delay = 0,
  startX,
  startY,
  targetX = 0,
  targetY = 0,
  onAnimationComplete,
}) => {
  const [state] = useState<StarState>({
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0),
    translateX: new Animated.Value(startX ?? -100),
    translateY: new Animated.Value(startY ?? 100),
    rotation: new Animated.Value(0),
    glowOpacity: new Animated.Value(0),
  });

  const [sparkles] = useState<SparkleState[]>(() => createSparkles(8));
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (animate && filled) {
      // Reset values
      state.scale.setValue(0);
      state.opacity.setValue(0);
      state.translateX.setValue(startX ?? -100 - index * 50);
      state.translateY.setValue(startY ?? 100);
      state.rotation.setValue(-2);
      state.glowOpacity.setValue(0);

      const flyDuration = 600;
      const settleDuration = 400;

      Animated.sequence([
        Animated.delay(delay),
        // Fly in with trail effect
        Animated.parallel([
          // Position
          Animated.timing(state.translateX, {
            toValue: targetX,
            duration: flyDuration,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(state.translateY, {
            toValue: targetY,
            duration: flyDuration,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          // Scale up during flight
          Animated.timing(state.scale, {
            toValue: 1.5,
            duration: flyDuration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Fade in
          Animated.timing(state.opacity, {
            toValue: 1,
            duration: flyDuration * 0.3,
            useNativeDriver: true,
          }),
          // Rotation
          Animated.timing(state.rotation, {
            toValue: 0,
            duration: flyDuration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // Settle with bounce
        Animated.parallel([
          Animated.spring(state.scale, {
            toValue: 1,
            friction: 4,
            tension: 200,
            useNativeDriver: true,
          }),
          // Glow pulse
          Animated.sequence([
            Animated.timing(state.glowOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(state.glowOpacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => {
        onAnimationComplete?.();
      });

      // Trigger sparkles when star arrives
      setTimeout(() => {
        setShowSparkles(true);
        animateSparkles();
        setTimeout(() => setShowSparkles(false), 600);
      }, delay + flyDuration - 100);
    }
  }, [animate, filled, delay]);

  const animateSparkles = () => {
    sparkles.forEach((sparkle, i) => {
      const distance = 30 + Math.random() * 20;
      const toX = Math.cos(sparkle.angle) * distance;
      const toY = Math.sin(sparkle.angle) * distance;

      sparkle.x.setValue(0);
      sparkle.y.setValue(0);
      sparkle.scale.setValue(0);
      sparkle.opacity.setValue(1);

      Animated.parallel([
        Animated.timing(sparkle.x, {
          toValue: toX,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sparkle.y, {
          toValue: toY,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(sparkle.scale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle.scale, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(sparkle.opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  if (!filled && !animate) {
    return (
      <View style={[styles.starContainer, { width: size, height: size }]}>
        <Text style={[styles.starEmpty, { fontSize: size }]}>☆</Text>
      </View>
    );
  }

  return (
    <View style={[styles.starContainer, { width: size * 1.5, height: size * 1.5 }]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.starGlow,
          {
            opacity: state.glowOpacity,
            transform: [{ scale: 2 }],
          },
        ]}
      />

      {/* Main star */}
      <Animated.View
        style={[
          styles.starWrapper,
          {
            transform: [
              { translateX: state.translateX },
              { translateY: state.translateY },
              { scale: state.scale },
              {
                rotate: state.rotation.interpolate({
                  inputRange: [-2, 0, 2],
                  outputRange: ['-720deg', '0deg', '720deg'],
                }),
              },
            ],
            opacity: state.opacity,
          },
        ]}
      >
        <Text style={[styles.starFilled, { fontSize: size }]}>⭐</Text>
      </Animated.View>

      {/* Sparkles */}
      {showSparkles && (
        <View style={styles.sparklesContainer}>
          {sparkles.map(sparkle => (
            <Animated.View
              key={sparkle.id}
              style={[
                styles.sparkle,
                {
                  transform: [
                    { translateX: sparkle.x },
                    { translateY: sparkle.y },
                    { scale: sparkle.scale },
                  ],
                  opacity: sparkle.opacity,
                },
              ]}
            >
              <Text style={styles.sparkleEmoji}>✨</Text>
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
};

type StarAnimationProps = {
  stars: number; // 0-3
  animate: boolean;
  size?: number;
  onComplete?: () => void;
};

export const StarAnimation: React.FC<StarAnimationProps> = ({
  stars,
  animate,
  size = 40,
  onComplete,
}) => {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (animate) {
      setCompletedCount(0);
    }
  }, [animate]);

  const handleStarComplete = () => {
    setCompletedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= stars && onComplete) {
        setTimeout(onComplete, 200);
      }
      return newCount;
    });
  };

  const getStartPosition = (index: number) => {
    // Stars come from different corners
    const positions = [
      { x: -SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 3 },
      { x: 0, y: SCREEN_HEIGHT / 2 },
      { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 3 },
    ];
    return positions[index] || positions[0];
  };

  const getTargetPosition = (index: number) => {
    // Position in row
    const spacing = size * 1.2;
    const totalWidth = spacing * 3;
    const startOffset = -totalWidth / 2 + spacing / 2;
    return { x: startOffset + index * spacing, y: 0 };
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2].map(index => {
        const filled = index < stars;
        const startPos = getStartPosition(index);
        const targetPos = getTargetPosition(index);

        return (
          <AnimatedStar
            key={index}
            index={index}
            filled={filled}
            animate={animate && filled}
            size={size}
            delay={index * 300}
            startX={startPos.x}
            startY={startPos.y}
            targetX={targetPos.x}
            targetY={targetPos.y}
            onAnimationComplete={handleStarComplete}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
  starContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  starWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  starFilled: {
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  starEmpty: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  starGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: '#FFD700',
    borderRadius: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  sparklesContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
    overflow: 'visible',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkleEmoji: {
    fontSize: 12,
  },
});
