import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Prize } from '../../hooks/useBonusGame';

type TreasureChestProps = {
  prizes: Prize[];
  onComplete: (prize: Prize) => void;
};

type ChestState = 'closed' | 'opening' | 'open';

const Chest: React.FC<{
  prize: Prize;
  index: number;
  onSelect: () => void;
  isSelected: boolean;
  isRevealed: boolean;
  isDisabled: boolean;
}> = ({ prize, index, onSelect, isSelected, isRevealed, isDisabled }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lidAnim = useRef(new Animated.Value(0)).current;
  const prizeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  // Idle bounce animation
  useEffect(() => {
    if (!isRevealed && !isDisabled) {
      const delay = index * 200;
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -8,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();

        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);
    }
  }, [isRevealed, isDisabled, index]);

  // Open animation
  useEffect(() => {
    if (isSelected) {
      bounceAnim.stopAnimation();
      glowAnim.stopAnimation();

      // Scale up slightly
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        friction: 5,
        useNativeDriver: true,
      }).start();

      // Open lid
      Animated.timing(lidAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }).start();

      // Prize floats up
      setTimeout(() => {
        Animated.spring(prizeAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }).start();

        // Sparkle effect
        Animated.loop(
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ).start();
      }, 300);
    }
  }, [isSelected]);

  // Fade out non-selected chests
  useEffect(() => {
    if (isDisabled && !isSelected) {
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isDisabled, isSelected]);

  return (
    <Animated.View
      style={[
        styles.chestContainer,
        {
          transform: [
            { translateY: bounceAnim },
            { scale: scaleAnim },
          ],
          opacity: isDisabled && !isSelected ? 0.4 : 1,
        },
      ]}
    >
      {/* Glow effect */}
      {!isDisabled && (
        <Animated.View
          style={[
            styles.chestGlow,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.6],
              }),
            },
          ]}
        />
      )}

      <TouchableOpacity
        onPress={onSelect}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        {/* Chest body */}
        <View style={styles.chestBody}>
          <View style={styles.chestFront}>
            <View style={styles.chestLock} />
          </View>
        </View>

        {/* Chest lid */}
        <Animated.View
          style={[
            styles.chestLid,
            {
              transform: [
                {
                  rotateX: lidAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '-120deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.chestLidTop} />
        </Animated.View>

        {/* Prize reveal */}
        {isSelected && (
          <Animated.View
            style={[
              styles.prizeReveal,
              {
                opacity: prizeAnim,
                transform: [
                  {
                    translateY: prizeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, -60],
                    }),
                  },
                  {
                    scale: prizeAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1.3, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.prizeIcon}>{prize.icon}</Text>
            <Text style={styles.prizeLabel}>{prize.label}</Text>

            {/* Sparkles */}
            {[0, 1, 2, 3].map((i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.sparkle,
                  {
                    transform: [
                      { rotate: `${i * 90}deg` },
                      {
                        translateY: sparkleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-30, -50],
                        }),
                      },
                    ],
                    opacity: sparkleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1, 0],
                    }),
                  },
                ]}
              >
                ✨
              </Animated.Text>
            ))}
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const TreasureChest: React.FC<TreasureChestProps> = ({ prizes, onComplete }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;

    setSelectedIndex(index);

    // Delay before calling onComplete
    setTimeout(() => {
      setRevealed(true);
      onComplete(prizes[index]);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {selectedIndex === null ? 'Pick a chest!' : 'You won!'}
      </Text>

      <View style={styles.chestsRow}>
        {prizes.map((prize, index) => (
          <Chest
            key={index}
            prize={prize}
            index={index}
            onSelect={() => handleSelect(index)}
            isSelected={selectedIndex === index}
            isRevealed={revealed}
            isDisabled={selectedIndex !== null}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 40,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  chestsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  chestContainer: {
    alignItems: 'center',
    width: 90,
  },
  chestGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFD700',
    top: 10,
  },
  chestBody: {
    width: 80,
    height: 60,
    backgroundColor: '#8B4513',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#D4A574',
    overflow: 'hidden',
  },
  chestFront: {
    flex: 1,
    backgroundColor: '#A0522D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestLock: {
    width: 16,
    height: 20,
    backgroundColor: '#FFD700',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#DAA520',
  },
  chestLid: {
    position: 'absolute',
    top: -5,
    width: 84,
    left: -2,
    transformOrigin: 'bottom',
  },
  chestLidTop: {
    width: 84,
    height: 25,
    backgroundColor: '#8B4513',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 3,
    borderColor: '#D4A574',
    borderBottomWidth: 0,
  },
  prizeReveal: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
  },
  prizeIcon: {
    fontSize: 48,
  },
  prizeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
  },
});
