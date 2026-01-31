import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============ CONFETTI ============

const CONFETTI_COLORS = [
  '#FFD700', // Gold
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#FF69B4', // Pink
];

type ConfettiPiece = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: 'square' | 'rectangle' | 'circle';
  targetX: number;
};

const createConfetti = (count: number): ConfettiPiece[] => {
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < count; i++) {
    const startX = Math.random() * SCREEN_WIDTH;
    const horizontalDrift = (Math.random() - 0.5) * 200;
    pieces.push({
      id: i,
      x: new Animated.Value(startX),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 8 + Math.random() * 8,
      shape: ['square', 'rectangle', 'circle'][Math.floor(Math.random() * 3)] as any,
      targetX: startX + horizontalDrift,
    });
  }
  return pieces;
};

type ConfettiProps = {
  active: boolean;
  count?: number;
};

export const Confetti: React.FC<ConfettiProps> = ({ active, count = 50 }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      const newPieces = createConfetti(count);
      setPieces(newPieces);

      // Animate each piece
      newPieces.forEach((piece, index) => {
        const delay = index * 30;
        const duration = 2500 + Math.random() * 1000;
        const rotations = 2 + Math.random() * 4;

        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            // Fall down
            Animated.timing(piece.y, {
              toValue: SCREEN_HEIGHT + 100,
              duration,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            // Horizontal drift
            Animated.timing(piece.x, {
              toValue: piece.targetX,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            // Rotation
            Animated.timing(piece.rotation, {
              toValue: rotations,
              duration,
              useNativeDriver: true,
            }),
            // Fade out near bottom
            Animated.sequence([
              Animated.delay(duration * 0.7),
              Animated.timing(piece.opacity, {
                toValue: 0,
                duration: duration * 0.3,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start();
      });

      // Clean up after animation
      const timeout = setTimeout(() => {
        setPieces([]);
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [active, count]);

  if (!active && pieces.length === 0) return null;

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {pieces.map(piece => (
        <Animated.View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: piece.color,
              width: piece.shape === 'rectangle' ? piece.size * 2 : piece.size,
              height: piece.size,
              borderRadius: piece.shape === 'circle' ? piece.size / 2 : 2,
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                {
                  rotate: piece.rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
                { scale: piece.scale },
              ],
              opacity: piece.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

// ============ COIN FOUNTAIN ============

type Coin = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  startX: number;
};

const createCoins = (count: number): Coin[] => {
  const coins: Coin[] = [];
  const centerX = SCREEN_WIDTH / 2;

  for (let i = 0; i < count; i++) {
    const startX = centerX + (Math.random() - 0.5) * 100;
    coins.push({
      id: i,
      x: new Animated.Value(startX),
      y: new Animated.Value(SCREEN_HEIGHT),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
      startX,
    });
  }
  return coins;
};

type CoinFountainProps = {
  active: boolean;
  count?: number;
};

export const CoinFountain: React.FC<CoinFountainProps> = ({ active, count = 20 }) => {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    if (active) {
      const newCoins = createCoins(count);
      setCoins(newCoins);

      newCoins.forEach((coin, index) => {
        const delay = index * 50;
        const peakHeight = SCREEN_HEIGHT * 0.3 + Math.random() * SCREEN_HEIGHT * 0.2;
        const horizontalSpread = (Math.random() - 0.5) * 300;
        const duration = 1500 + Math.random() * 500;

        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            // Vertical: shoot up then fall
            Animated.sequence([
              Animated.timing(coin.y, {
                toValue: peakHeight,
                duration: duration * 0.4,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(coin.y, {
                toValue: SCREEN_HEIGHT + 50,
                duration: duration * 0.6,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            // Horizontal spread
            Animated.timing(coin.x, {
              toValue: coin.startX + horizontalSpread,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            // Spin
            Animated.timing(coin.rotation, {
              toValue: 3 + Math.random() * 3,
              duration,
              useNativeDriver: true,
            }),
            // Fade at the end
            Animated.sequence([
              Animated.delay(duration * 0.8),
              Animated.timing(coin.opacity, {
                toValue: 0,
                duration: duration * 0.2,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start();
      });

      const timeout = setTimeout(() => {
        setCoins([]);
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, [active, count]);

  if (!active && coins.length === 0) return null;

  return (
    <View style={styles.coinContainer} pointerEvents="none">
      {coins.map(coin => (
        <Animated.View
          key={coin.id}
          style={[
            styles.coin,
            {
              transform: [
                { translateX: coin.x },
                { translateY: coin.y },
                { scale: coin.scale },
                {
                  rotateY: coin.rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: coin.opacity,
            },
          ]}
        >
          <Text style={styles.coinEmoji}>🪙</Text>
        </Animated.View>
      ))}
    </View>
  );
};

// ============ STAR BURST ============

type StarParticle = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  angle: number;
};

const createStars = (count: number, centerX: number, centerY: number): StarParticle[] => {
  const stars: StarParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    stars.push({
      id: i,
      x: new Animated.Value(centerX),
      y: new Animated.Value(centerY),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      angle,
    });
  }
  return stars;
};

type StarBurstProps = {
  active: boolean;
  count?: number;
  centerX?: number;
  centerY?: number;
};

export const StarBurst: React.FC<StarBurstProps> = ({
  active,
  count = 12,
  centerX = SCREEN_WIDTH / 2,
  centerY = SCREEN_HEIGHT / 2,
}) => {
  const [stars, setStars] = useState<StarParticle[]>([]);

  useEffect(() => {
    if (active) {
      const newStars = createStars(count, centerX, centerY);
      setStars(newStars);

      newStars.forEach((star, index) => {
        const delay = index * 30;
        const distance = 100 + Math.random() * 100;
        const duration = 800 + Math.random() * 400;

        const toX = centerX + Math.cos(star.angle) * distance;
        const toY = centerY + Math.sin(star.angle) * distance;

        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            // Move outward
            Animated.timing(star.x, {
              toValue: toX,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(star.y, {
              toValue: toY,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            // Scale: pop in then shrink
            Animated.sequence([
              Animated.timing(star.scale, {
                toValue: 1.2,
                duration: duration * 0.3,
                easing: Easing.out(Easing.back(2)),
                useNativeDriver: true,
              }),
              Animated.timing(star.scale, {
                toValue: 0.3,
                duration: duration * 0.7,
                useNativeDriver: true,
              }),
            ]),
            // Fade out
            Animated.sequence([
              Animated.delay(duration * 0.5),
              Animated.timing(star.opacity, {
                toValue: 0,
                duration: duration * 0.5,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start();
      });

      const timeout = setTimeout(() => {
        setStars([]);
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [active, count, centerX, centerY]);

  if (!active && stars.length === 0) return null;

  return (
    <View style={styles.starBurstContainer} pointerEvents="none">
      {stars.map(star => (
        <Animated.View
          key={star.id}
          style={[
            styles.starParticle,
            {
              transform: [
                { translateX: Animated.subtract(star.x, 12) },
                { translateY: Animated.subtract(star.y, 12) },
                { scale: star.scale },
              ],
              opacity: star.opacity,
            },
          ]}
        >
          <Text style={styles.starEmoji}>⭐</Text>
        </Animated.View>
      ))}
    </View>
  );
};

// ============ LIGHT RAYS ============

type LightRay = {
  id: number;
  rotation: number;
  scale: Animated.Value;
  opacity: Animated.Value;
};

const createRays = (count: number): LightRay[] => {
  const rays: LightRay[] = [];
  for (let i = 0; i < count; i++) {
    rays.push({
      id: i,
      rotation: (i / count) * 360,
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    });
  }
  return rays;
};

type LightRaysProps = {
  active: boolean;
  count?: number;
};

export const LightRays: React.FC<LightRaysProps> = ({ active, count = 8 }) => {
  const [rays, setRays] = useState<LightRay[]>([]);
  const containerRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      const newRays = createRays(count);
      setRays(newRays);

      // Container rotation
      Animated.timing(containerRotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();

      // Individual ray animations
      newRays.forEach((ray, index) => {
        const delay = index * 50;

        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            // Scale up
            Animated.timing(ray.scale, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            // Fade in then out
            Animated.sequence([
              Animated.timing(ray.opacity, {
                toValue: 0.6,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.delay(1000),
              Animated.timing(ray.opacity, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start();
      });

      const timeout = setTimeout(() => {
        setRays([]);
        containerRotation.setValue(0);
      }, 2500);

      return () => clearTimeout(timeout);
    }
  }, [active, count]);

  if (!active && rays.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.lightRaysContainer,
        {
          transform: [
            {
              rotate: containerRotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '45deg'],
              }),
            },
          ],
        },
      ]}
      pointerEvents="none"
    >
      {rays.map(ray => (
        <Animated.View
          key={ray.id}
          style={[
            styles.lightRay,
            {
              transform: [
                { rotate: `${ray.rotation}deg` },
                { scaleY: ray.scale },
              ],
              opacity: ray.opacity,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
};

// ============ COMBINED CELEBRATION ============

type CelebrationProps = {
  active: boolean;
  type?: 'levelComplete' | 'bigWin' | 'achievement';
};

export const Celebration: React.FC<CelebrationProps> = ({ active, type = 'levelComplete' }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [showRays, setShowRays] = useState(false);

  useEffect(() => {
    if (active) {
      // Stagger the effects for more impact
      setShowRays(true);
      setTimeout(() => setShowStars(true), 100);
      setTimeout(() => setShowCoins(true), 200);
      setTimeout(() => setShowConfetti(true), 300);

      // Reset after animation
      const timeout = setTimeout(() => {
        setShowConfetti(false);
        setShowCoins(false);
        setShowStars(false);
        setShowRays(false);
      }, 4000);

      return () => clearTimeout(timeout);
    } else {
      setShowConfetti(false);
      setShowCoins(false);
      setShowStars(false);
      setShowRays(false);
    }
  }, [active]);

  return (
    <View style={styles.celebrationContainer} pointerEvents="none">
      <LightRays active={showRays} />
      <StarBurst active={showStars} />
      <CoinFountain active={showCoins} count={type === 'bigWin' ? 30 : 15} />
      <Confetti active={showConfetti} count={type === 'levelComplete' ? 60 : 40} />
    </View>
  );
};

const styles = StyleSheet.create({
  celebrationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiPiece: {
    position: 'absolute',
  },
  coinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  coin: {
    position: 'absolute',
  },
  coinEmoji: {
    fontSize: 28,
  },
  starBurstContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  starParticle: {
    position: 'absolute',
  },
  starEmoji: {
    fontSize: 24,
  },
  lightRaysContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightRay: {
    position: 'absolute',
    width: 8,
    height: SCREEN_HEIGHT,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 4,
    transformOrigin: 'center bottom',
  },
});
