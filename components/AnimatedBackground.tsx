import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============ FLOATING PARTICLES ============

type Particle = {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  size: number;
  color: string;
  speed: number;
};

const PARTICLE_COLORS = [
  'rgba(255, 215, 0, 0.3)', // Gold
  'rgba(255, 255, 255, 0.2)', // White
  'rgba(100, 200, 255, 0.2)', // Light blue
  'rgba(255, 100, 200, 0.2)', // Pink
];

const createParticles = (count: number): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(Math.random() * SCREEN_HEIGHT),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      opacity: new Animated.Value(0),
      size: 4 + Math.random() * 8,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      speed: 0.5 + Math.random() * 1,
    });
  }
  return particles;
};

type FloatingParticlesProps = {
  count?: number;
  active?: boolean;
};

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 20,
  active = true,
}) => {
  const [particles] = useState<Particle[]>(() => createParticles(count));

  useEffect(() => {
    if (!active) return;

    particles.forEach((particle, index) => {
      const animateParticle = () => {
        // Reset to bottom with random x
        particle.y.setValue(SCREEN_HEIGHT + 50);
        particle.x.setValue(Math.random() * SCREEN_WIDTH);
        particle.opacity.setValue(0);

        const duration = (8000 + Math.random() * 4000) / particle.speed;

        // Float up
        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -50,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          // Gentle horizontal drift - use current position offset
          Animated.timing(particle.x, {
            toValue: Math.random() * SCREEN_WIDTH,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          // Fade in then out
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
            Animated.delay(duration * 0.6),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
          ]),
          // Subtle scale pulse
          Animated.loop(
            Animated.sequence([
              Animated.timing(particle.scale, {
                toValue: 0.8,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 1.2,
                duration: 1500,
                useNativeDriver: true,
              }),
            ])
          ),
        ]).start(() => {
          if (active) animateParticle();
        });
      };

      // Stagger start
      setTimeout(animateParticle, index * 500);
    });

    return () => {
      particles.forEach(p => {
        p.x.stopAnimation();
        p.y.stopAnimation();
        p.scale.stopAnimation();
        p.opacity.stopAnimation();
      });
    };
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.particlesContainer} pointerEvents="none">
      {particles.map(particle => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

// ============ GRADIENT OVERLAY ============

type GradientPulseProps = {
  active?: boolean;
  intensity?: number;
};

export const GradientPulse: React.FC<GradientPulseProps> = ({
  active = true,
  intensity = 1,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const colorShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      // Pulsing opacity
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.15 * intensity,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.05 * intensity,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Color shift
      Animated.loop(
        Animated.timing(colorShift, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }

    return () => {
      opacity.stopAnimation();
      colorShift.stopAnimation();
    };
  }, [active, intensity]);

  if (!active) return null;

  return (
    <View style={styles.gradientContainer} pointerEvents="none">
      {/* Top gradient */}
      <Animated.View
        style={[
          styles.gradientTop,
          { opacity },
        ]}
      />
      {/* Bottom gradient */}
      <Animated.View
        style={[
          styles.gradientBottom,
          { opacity },
        ]}
      />
      {/* Side accents */}
      <Animated.View
        style={[
          styles.accentLeft,
          {
            opacity: Animated.multiply(opacity, 0.5),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.accentRight,
          {
            opacity: Animated.multiply(opacity, 0.5),
          },
        ]}
      />
    </View>
  );
};

// ============ COMBO INTENSITY BACKGROUND ============

type ComboBackgroundProps = {
  combo: number;
};

export const ComboBackground: React.FC<ComboBackgroundProps> = ({ combo }) => {
  const intensity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (combo >= 3) {
      const targetIntensity = Math.min((combo - 2) * 0.1, 0.5);

      Animated.timing(intensity, {
        toValue: targetIntensity,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Pulse effect for high combos
      if (combo >= 5) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: 0.1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    } else {
      Animated.timing(intensity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [combo]);

  const getColor = () => {
    if (combo >= 10) return 'rgba(255, 0, 255, 0.3)'; // Magenta
    if (combo >= 8) return 'rgba(255, 69, 0, 0.3)'; // Orange-red
    if (combo >= 5) return 'rgba(255, 215, 0, 0.3)'; // Gold
    return 'rgba(255, 165, 0, 0.2)'; // Orange
  };

  if (combo < 3) return null;

  return (
    <Animated.View
      style={[
        styles.comboBackground,
        {
          backgroundColor: getColor(),
          opacity: Animated.add(intensity, pulse),
        },
      ]}
      pointerEvents="none"
    />
  );
};

// ============ COMBINED ANIMATED BACKGROUND ============

type AnimatedBackgroundProps = {
  children: React.ReactNode;
  combo?: number;
  particlesEnabled?: boolean;
  gradientEnabled?: boolean;
};

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  combo = 0,
  particlesEnabled = true,
  gradientEnabled = true,
}) => {
  return (
    <View style={styles.container}>
      {/* Base background */}
      <View style={styles.baseBackground} />

      {/* Animated elements */}
      {gradientEnabled && <GradientPulse />}
      {particlesEnabled && <FloatingParticles count={15} />}
      {combo > 0 && <ComboBackground combo={combo} />}

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  baseBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a2e',
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: '#FFD700',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.3,
    backgroundColor: '#4B0082',
  },
  accentLeft: {
    position: 'absolute',
    top: '20%',
    left: 0,
    width: 100,
    height: '60%',
    backgroundColor: '#00BFFF',
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
  },
  accentRight: {
    position: 'absolute',
    top: '30%',
    right: 0,
    width: 80,
    height: '40%',
    backgroundColor: '#FF69B4',
    borderTopLeftRadius: 80,
    borderBottomLeftRadius: 80,
  },
  comboBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
