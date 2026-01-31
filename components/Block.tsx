import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Pressable, Animated, Text, View, Easing } from 'react-native';
import { BLOCK_SIZE, BLOCK_MARGIN, TOTAL_BLOCK_SIZE, GRID_SIZE } from '../utils/constants';
import { SpecialType } from '../utils/boardUtils';

export type SwapDirection = 'left' | 'right' | 'up' | 'down' | null;

type RocketActivation = {
  row: number;
  col: number;
  type: 'rocket-h' | 'rocket-v';
};

type RainbowActivation = {
  row: number;
  col: number;
  targetColor: string;
};

type BombActivation = {
  row: number;
  col: number;
  size?: number; // 3 for normal, 5 for combo
};

type BlockProps = {
  color: string;
  row: number;
  col: number;
  isSelected: boolean;
  swapDirection: SwapDirection;
  specialType: SpecialType;
  isExploding: boolean;
  isRocketExplosion: boolean;
  rocketActivation?: RocketActivation;
  bombActivation?: BombActivation;
  rainbowActivation?: RainbowActivation;
  onPress: () => void;
  onSwapAnimationComplete?: () => void;
};

const PARTICLE_COUNT = 8;
const PARTICLE_SIZE = 12;
const SHARD_COUNT = 6;
const SHARD_WIDTH = 8;
const SHARD_HEIGHT = 16;

type Particle = {
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  angle: number;
};

type Shard = {
  translateX: Animated.Value;
  translateY: Animated.Value;
  rotation: Animated.Value;
  opacity: Animated.Value;
  initialX: number;
};

const createParticles = (): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
    particles.push({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
      angle,
    });
  }
  return particles;
};

const createShards = (): Shard[] => {
  const shards: Shard[] = [];
  for (let i = 0; i < SHARD_COUNT; i++) {
    const initialX = (Math.random() - 0.5) * BLOCK_SIZE;
    shards.push({
      translateX: new Animated.Value(initialX),
      translateY: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
      initialX,
    });
  }
  return shards;
};

const RocketIcon: React.FC<{ type: 'rocket-h' | 'rocket-v' }> = ({ type }) => {
  return (
    <View style={styles.iconContainer}>
      <Text style={styles.rocketIcon}>
        {type === 'rocket-h' ? '→' : '↓'}
      </Text>
    </View>
  );
};

const RainbowIcon: React.FC = () => {
  return (
    <View style={styles.iconContainer}>
      <Text style={styles.rainbowIcon}>✦</Text>
    </View>
  );
};

const BombIcon: React.FC = () => {
  return (
    <View style={styles.iconContainer}>
      <Text style={styles.bombIcon}>💣</Text>
    </View>
  );
};

const PropellerIcon: React.FC = () => {
  return (
    <View style={styles.iconContainer}>
      <Text style={styles.propellerIcon}>✈</Text>
    </View>
  );
};

const ExplosionParticles: React.FC<{
  particles: Particle[];
  color: string;
  isRocket: boolean;
}> = ({ particles, color, isRocket }) => {
  return (
    <View style={styles.particlesContainer} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              backgroundColor: color,
              width: isRocket ? PARTICLE_SIZE + 4 : PARTICLE_SIZE,
              height: isRocket ? PARTICLE_SIZE + 4 : PARTICLE_SIZE,
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale },
                { rotate: particle.rotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })},
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const FallingShards: React.FC<{
  shards: Shard[];
  color: string;
}> = ({ shards, color }) => {
  return (
    <View style={styles.shardsContainer} pointerEvents="none">
      {shards.map((shard, index) => (
        <Animated.View
          key={index}
          style={[
            styles.shard,
            {
              backgroundColor: color,
              transform: [
                { translateX: shard.translateX },
                { translateY: shard.translateY },
                { rotate: shard.rotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '720deg'],
                })},
              ],
              opacity: shard.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Rocket Beam Animation Component
const RocketBeamAnimation: React.FC<{
  type: 'rocket-h' | 'rocket-v';
  color: string;
  col: number;
  row: number;
}> = ({ type, color, col, row }) => {
  const beamProgress = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(beamProgress, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 250,
          delay: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const isHorizontal = type === 'rocket-h';
  const boardSize = GRID_SIZE * TOTAL_BLOCK_SIZE;

  // Calculate beam position and size
  const beamWidth = isHorizontal ? boardSize : 6;
  const beamHeight = isHorizontal ? 6 : boardSize;

  // Position beam at center of block, extending both directions
  const startX = isHorizontal ? -col * TOTAL_BLOCK_SIZE - BLOCK_SIZE / 2 : 0;
  const startY = isHorizontal ? 0 : -row * TOTAL_BLOCK_SIZE - BLOCK_SIZE / 2;

  return (
    <View style={[styles.beamContainer, { zIndex: 200 }]} pointerEvents="none">
      {/* Main beam */}
      <Animated.View
        style={[
          styles.rocketBeam,
          {
            width: beamWidth,
            height: beamHeight,
            backgroundColor: color,
            left: startX,
            top: startY,
            opacity: glowOpacity,
            transform: [
              { scaleX: isHorizontal ? beamProgress : 1 },
              { scaleY: isHorizontal ? 1 : beamProgress },
            ],
          },
        ]}
      />
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.rocketBeamGlow,
          {
            width: isHorizontal ? beamWidth : 20,
            height: isHorizontal ? 20 : beamHeight,
            backgroundColor: color,
            left: startX - (isHorizontal ? 0 : 7),
            top: startY - (isHorizontal ? 7 : 0),
            opacity: Animated.multiply(glowOpacity, 0.5),
            transform: [
              { scaleX: isHorizontal ? beamProgress : 1 },
              { scaleY: isHorizontal ? 1 : beamProgress },
            ],
          },
        ]}
      />
    </View>
  );
};

// Bomb Shockwave Animation Component
const BombShockwaveAnimation: React.FC<{
  color: string;
  size?: number; // 3 for normal, 5 for mega combo
}> = ({ color, size = 3 }) => {
  const isMega = size >= 5;
  const ring1Scale = useRef(new Animated.Value(0.3)).current;
  const ring2Scale = useRef(new Animated.Value(0.3)).current;
  const ring3Scale = useRef(new Animated.Value(0.3)).current;
  const ring4Scale = useRef(new Animated.Value(0.3)).current;
  const ring5Scale = useRef(new Animated.Value(0.3)).current;
  const ring1Opacity = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(1)).current;
  const ring3Opacity = useRef(new Animated.Value(1)).current;
  const ring4Opacity = useRef(new Animated.Value(1)).current;
  const ring5Opacity = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(1)).current;
  const flashScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Flash effect - bigger and more dramatic for mega bombs
    Animated.parallel([
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: isMega ? 200 : 100,
        useNativeDriver: true,
      }),
      isMega ? Animated.timing(flashScale, {
        toValue: 3,
        duration: 200,
        useNativeDriver: true,
      }) : Animated.timing(flashScale, { toValue: 1, duration: 0, useNativeDriver: true }),
    ]).start();

    // Staggered ring animations
    const maxScale = isMega ? 5 : 3;
    const duration = isMega ? 400 : 300;
    const ringAnimation = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: maxScale,
            duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ]),
      ]);
    };

    const animations = [
      ringAnimation(ring1Scale, ring1Opacity, 0),
      ringAnimation(ring2Scale, ring2Opacity, 50),
      ringAnimation(ring3Scale, ring3Opacity, 100),
    ];

    if (isMega) {
      animations.push(
        ringAnimation(ring4Scale, ring4Opacity, 150),
        ringAnimation(ring5Scale, ring5Opacity, 200)
      );
    }

    Animated.parallel(animations).start();
  }, [isMega]);

  const ringStyle = {
    position: 'absolute' as const,
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    borderRadius: BLOCK_SIZE / 2,
    borderWidth: isMega ? 6 : 4,
    borderColor: '#FF4500',
  };

  return (
    <View style={styles.shockwaveContainer} pointerEvents="none">
      {/* White flash */}
      <Animated.View
        style={[
          styles.bombFlash,
          isMega && styles.megaBombFlash,
          {
            opacity: flashOpacity,
            transform: [{ scale: flashScale }],
          },
        ]}
      />
      {/* Shockwave rings */}
      <Animated.View
        style={[
          ringStyle,
          {
            transform: [{ scale: ring1Scale }],
            opacity: ring1Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          ringStyle,
          {
            borderColor: '#FF6347',
            transform: [{ scale: ring2Scale }],
            opacity: ring2Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          ringStyle,
          {
            borderColor: '#FFA500',
            transform: [{ scale: ring3Scale }],
            opacity: ring3Opacity,
          },
        ]}
      />
      {/* Extra rings for mega bomb */}
      {isMega && (
        <>
          <Animated.View
            style={[
              ringStyle,
              {
                borderColor: '#FFD700',
                transform: [{ scale: ring4Scale }],
                opacity: ring4Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              ringStyle,
              {
                borderColor: '#FFFFFF',
                borderWidth: 8,
                transform: [{ scale: ring5Scale }],
                opacity: ring5Opacity,
              },
            ]}
          />
        </>
      )}
    </View>
  );
};

// Rainbow Wave Animation Component
const RainbowWaveAnimation: React.FC<{
  targetColor: string;
}> = ({ targetColor }) => {
  const ring1Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring3Scale = useRef(new Animated.Value(0.5)).current;
  const ring1Opacity = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(1)).current;
  const ring3Opacity = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Central pulse
    Animated.sequence([
      Animated.timing(pulseScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseScale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Expanding rings with rainbow colors
    const ringAnimation = (scale: Animated.Value, opacity: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 5,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]);
    };

    Animated.parallel([
      ringAnimation(ring1Scale, ring1Opacity, 0),
      ringAnimation(ring2Scale, ring2Opacity, 80),
      ringAnimation(ring3Scale, ring3Opacity, 160),
    ]).start();
  }, []);

  const ringStyle = {
    position: 'absolute' as const,
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    borderRadius: BLOCK_SIZE / 2,
    borderWidth: 3,
  };

  return (
    <View style={styles.rainbowWaveContainer} pointerEvents="none">
      {/* Central pulse */}
      <Animated.View
        style={[
          styles.rainbowPulse,
          {
            backgroundColor: targetColor,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />
      {/* Rainbow rings */}
      <Animated.View
        style={[
          ringStyle,
          {
            borderColor: '#FFD700',
            transform: [{ scale: ring1Scale }],
            opacity: ring1Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          ringStyle,
          {
            borderColor: targetColor,
            transform: [{ scale: ring2Scale }],
            opacity: ring2Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          ringStyle,
          {
            borderColor: '#FFFFFF',
            transform: [{ scale: ring3Scale }],
            opacity: ring3Opacity,
          },
        ]}
      />
    </View>
  );
};

export const Block: React.FC<BlockProps> = ({
  color,
  row,
  col,
  isSelected,
  swapDirection,
  specialType,
  isExploding,
  isRocketExplosion,
  rocketActivation,
  bombActivation,
  rainbowActivation,
  onPress,
  onSwapAnimationComplete,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(color ? 1 : 0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const isExplodingRef = useRef(false);
  const [particles] = useState<Particle[]>(() => createParticles());
  const [shards] = useState<Shard[]>(() => createShards());
  const [showParticles, setShowParticles] = useState(false);
  const [showShards, setShowShards] = useState(false);
  const [showRocketBeam, setShowRocketBeam] = useState(false);
  const [showBombShockwave, setShowBombShockwave] = useState(false);
  const [showRainbowWave, setShowRainbowWave] = useState(false);

  // Handle rocket activation animation
  useEffect(() => {
    if (rocketActivation) {
      setShowRocketBeam(true);
      const timer = setTimeout(() => setShowRocketBeam(false), 400);
      return () => clearTimeout(timer);
    }
  }, [rocketActivation]);

  // Handle bomb activation animation
  useEffect(() => {
    if (bombActivation) {
      setShowBombShockwave(true);
      // Longer duration for mega bombs (5x5)
      const duration = (bombActivation.size ?? 3) >= 5 ? 500 : 350;
      const timer = setTimeout(() => setShowBombShockwave(false), duration);
      return () => clearTimeout(timer);
    }
  }, [bombActivation]);

  // Handle rainbow activation animation
  useEffect(() => {
    if (rainbowActivation) {
      setShowRainbowWave(true);
      const timer = setTimeout(() => setShowRainbowWave(false), 500);
      return () => clearTimeout(timer);
    }
  }, [rainbowActivation]);

  // Handle swap animation
  useEffect(() => {
    if (swapDirection) {
      let toX = 0;
      let toY = 0;

      switch (swapDirection) {
        case 'left':
          toX = -TOTAL_BLOCK_SIZE;
          break;
        case 'right':
          toX = TOTAL_BLOCK_SIZE;
          break;
        case 'up':
          toY = -TOTAL_BLOCK_SIZE;
          break;
        case 'down':
          toY = TOTAL_BLOCK_SIZE;
          break;
      }

      Animated.spring(translateX, {
        toValue: toX,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();

      Animated.spring(translateY, {
        toValue: toY,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start(() => {
        translateX.setValue(0);
        translateY.setValue(0);
        onSwapAnimationComplete?.();
      });
    }
  }, [swapDirection]);

  // Handle color change (new block appearing)
  useEffect(() => {
    if (color) {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [color]);

  // Handle selection animation
  useEffect(() => {
    if (!isExploding) {
      Animated.spring(scale, {
        toValue: isSelected ? 1.15 : 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  }, [isSelected, isExploding]);

  // Handle explosion animation with particles
  useEffect(() => {
    if (isExploding && !isExplodingRef.current) {
      isExplodingRef.current = true;
      setShowParticles(true);

      const duration = isRocketExplosion ? 300 : 250;
      const distance = isRocketExplosion ? 50 : 35;

      // Animate the block (scale up and fade)
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0.2,
          duration: duration * 0.6,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration * 0.6,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate particles bursting outward
      const particleAnimations = particles.map((particle, index) => {
        // Add some randomness to each particle
        const randomOffset = (Math.random() - 0.5) * 0.5;
        const finalAngle = particle.angle + randomOffset;
        const randomDistance = distance * (0.7 + Math.random() * 0.6);

        const toX = Math.cos(finalAngle) * randomDistance;
        const toY = Math.sin(finalAngle) * randomDistance;

        // Start particle visible
        particle.opacity.setValue(1);

        return Animated.parallel([
          // Move outward
          Animated.timing(particle.translateX, {
            toValue: toX,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: toY,
            duration,
            useNativeDriver: true,
          }),
          // Fade out (start visible)
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
          // Scale down as they fly
          Animated.timing(particle.scale, {
            toValue: 0.3,
            duration,
            useNativeDriver: true,
          }),
          // Rotate
          Animated.timing(particle.rotation, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(particleAnimations).start(() => {
        setShowParticles(false);
      });

      // Start falling shards animation
      setShowShards(true);
      const shardDuration = 600;
      const fallDistance = 150;

      const shardAnimations = shards.map((shard) => {
        const horizontalDrift = (Math.random() - 0.5) * 40;
        const rotations = 1 + Math.random() * 1.5;
        const delay = Math.random() * 50;

        shard.opacity.setValue(1);
        shard.translateX.setValue(shard.initialX);
        shard.translateY.setValue(0);
        shard.rotation.setValue(0);

        return Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(shard.translateY, {
              toValue: fallDistance + Math.random() * 50,
              duration: shardDuration,
              useNativeDriver: true,
            }),
            Animated.timing(shard.translateX, {
              toValue: shard.initialX + horizontalDrift,
              duration: shardDuration,
              useNativeDriver: true,
            }),
            Animated.timing(shard.rotation, {
              toValue: rotations,
              duration: shardDuration,
              useNativeDriver: true,
            }),
            Animated.timing(shard.opacity, {
              toValue: 0,
              duration: shardDuration,
              delay: shardDuration * 0.3,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      Animated.parallel(shardAnimations).start(() => {
        setShowShards(false);
      });

    } else if (!isExploding && isExplodingRef.current) {
      // Reset for reuse
      isExplodingRef.current = false;
      scale.setValue(1);
      opacity.setValue(1);

      // Reset particles
      particles.forEach(particle => {
        particle.translateX.setValue(0);
        particle.translateY.setValue(0);
        particle.scale.setValue(1);
        particle.opacity.setValue(0);
        particle.rotation.setValue(0);
      });

      // Reset shards
      shards.forEach(shard => {
        shard.translateX.setValue(shard.initialX);
        shard.translateY.setValue(0);
        shard.rotation.setValue(0);
        shard.opacity.setValue(0);
      });
    }
  }, [isExploding, isRocketExplosion]);

  if (!color) {
    return <Animated.View style={[styles.emptyBlock, { opacity }]} />;
  }

  const isRocket = specialType === 'rocket-h' || specialType === 'rocket-v';
  const isRainbow = specialType === 'rainbow';
  const isBomb = specialType === 'bomb';
  const isPropeller = specialType === 'propeller';

  return (
    <View style={[styles.blockContainer, showParticles && styles.explodingContainer]}>
      <Pressable onPress={onPress}>
        <Animated.View
          style={[
            styles.block,
            { backgroundColor: color },
            isSelected && styles.selected,
            isRocket && styles.rocketBlock,
            isRainbow && styles.rainbowBlock,
            isBomb && styles.bombBlock,
            isPropeller && styles.propellerBlock,
            {
              transform: [
                { translateX },
                { translateY },
                { scale },
              ],
              opacity,
            },
          ]}
        >
          {/* Gem facet effects */}
          <View style={styles.gemFacetTop} />
          <View style={styles.gemFacetLeft} />
          <View style={styles.gemFacetRight} />
          <View style={styles.gemFacetBottom} />
          <View style={styles.gemShineTop} />
          <View style={styles.gemShineSmall} />
          <View style={styles.gemInnerGlow} />

          {isRocket && <RocketIcon type={specialType as 'rocket-h' | 'rocket-v'} />}
          {isRainbow && <RainbowIcon />}
          {isBomb && <BombIcon />}
          {isPropeller && <PropellerIcon />}
        </Animated.View>
      </Pressable>
      {showParticles && (
        <ExplosionParticles
          particles={particles}
          color={color}
          isRocket={isRocketExplosion}
        />
      )}
      {showShards && (
        <FallingShards
          shards={shards}
          color={color}
        />
      )}
      {showRocketBeam && rocketActivation && (
        <RocketBeamAnimation
          type={rocketActivation.type}
          color={color}
          col={col}
          row={row}
        />
      )}
      {showBombShockwave && bombActivation && (
        <BombShockwaveAnimation color={color} size={bombActivation.size} />
      )}
      {showRainbowWave && rainbowActivation && (
        <RainbowWaveAnimation targetColor={rainbowActivation.targetColor} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  blockContainer: {
    width: BLOCK_SIZE + BLOCK_MARGIN * 2,
    height: BLOCK_SIZE + BLOCK_MARGIN * 2,
    position: 'relative',
    overflow: 'visible',
  },
  explodingContainer: {
    zIndex: 100,
  },
  block: {
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    margin: BLOCK_MARGIN,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // Gem border effect
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.6)',
    borderLeftColor: 'rgba(255, 255, 255, 0.4)',
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomColor: 'rgba(0, 0, 0, 0.4)',
  },
  selected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  rocketBlock: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  rainbowBlock: {
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  bombBlock: {
    borderWidth: 3,
    borderColor: '#FF4500',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  propellerBlock: {
    borderWidth: 3,
    borderColor: '#00BFFF',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  emptyBlock: {
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    margin: BLOCK_MARGIN,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rocketIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  rainbowIcon: {
    fontSize: 28,
    color: '#FFD700',
    textShadowColor: '#FFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  bombIcon: {
    fontSize: 22,
  },
  propellerIcon: {
    fontSize: 22,
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  particlesContainer: {
    position: 'absolute',
    top: BLOCK_MARGIN + BLOCK_SIZE / 2 - PARTICLE_SIZE / 2,
    left: BLOCK_MARGIN + BLOCK_SIZE / 2 - PARTICLE_SIZE / 2,
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    overflow: 'visible',
    zIndex: 100,
  },
  particle: {
    position: 'absolute',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 10,
  },
  shardsContainer: {
    position: 'absolute',
    top: BLOCK_MARGIN + BLOCK_SIZE / 2,
    left: BLOCK_MARGIN + BLOCK_SIZE / 2,
    width: 0,
    height: 0,
    overflow: 'visible',
    zIndex: 99,
  },
  shard: {
    position: 'absolute',
    width: SHARD_WIDTH,
    height: SHARD_HEIGHT,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  // Rocket beam styles
  beamContainer: {
    position: 'absolute',
    top: BLOCK_MARGIN + BLOCK_SIZE / 2 - 3,
    left: BLOCK_MARGIN + BLOCK_SIZE / 2,
    overflow: 'visible',
  },
  rocketBeam: {
    position: 'absolute',
    borderRadius: 3,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 15,
  },
  rocketBeamGlow: {
    position: 'absolute',
    borderRadius: 10,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  // Bomb shockwave styles
  shockwaveContainer: {
    position: 'absolute',
    top: BLOCK_MARGIN,
    left: BLOCK_MARGIN,
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    zIndex: 150,
  },
  bombFlash: {
    position: 'absolute',
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  megaBombFlash: {
    width: BLOCK_SIZE * 2,
    height: BLOCK_SIZE * 2,
    marginLeft: -BLOCK_SIZE / 2,
    marginTop: -BLOCK_SIZE / 2,
    borderRadius: BLOCK_SIZE,
    backgroundColor: '#FFD700',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  // Rainbow wave styles
  rainbowWaveContainer: {
    position: 'absolute',
    top: BLOCK_MARGIN,
    left: BLOCK_MARGIN,
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    zIndex: 150,
  },
  rainbowPulse: {
    position: 'absolute',
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    borderRadius: BLOCK_SIZE / 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  // Gem facet styles for ruby-like appearance
  gemFacetTop: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: '35%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderBottomLeftRadius: BLOCK_SIZE * 0.3,
    borderBottomRightRadius: BLOCK_SIZE * 0.3,
  },
  gemFacetLeft: {
    position: 'absolute',
    top: '20%',
    left: 0,
    width: '30%',
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderTopRightRadius: BLOCK_SIZE * 0.2,
    borderBottomRightRadius: BLOCK_SIZE * 0.2,
  },
  gemFacetRight: {
    position: 'absolute',
    top: '20%',
    right: 0,
    width: '30%',
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderTopLeftRadius: BLOCK_SIZE * 0.2,
    borderBottomLeftRadius: BLOCK_SIZE * 0.2,
  },
  gemFacetBottom: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: '25%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderTopLeftRadius: BLOCK_SIZE * 0.25,
    borderTopRightRadius: BLOCK_SIZE * 0.25,
  },
  gemShineTop: {
    position: 'absolute',
    top: 4,
    left: 6,
    width: '40%',
    height: '20%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: BLOCK_SIZE * 0.15,
    transform: [{ rotate: '-15deg' }],
  },
  gemShineSmall: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 3,
  },
  gemInnerGlow: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '50%',
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BLOCK_SIZE * 0.2,
  },
});
