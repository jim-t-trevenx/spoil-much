import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { AnimatedBackground } from './AnimatedBackground';
import { SpinWheel } from './BonusGames/SpinWheel';
import { TreasureChest } from './BonusGames/TreasureChest';
import { ScratchCard } from './BonusGames/ScratchCard';
import { useBonusGame, BonusGameType, Prize, ScratchSymbol } from '../hooks/useBonusGame';
import { GlowButton } from './GlowButton';

type BonusGameScreenProps = {
  gameType: BonusGameType;
  earnedStars: number;
  onComplete: (prize: Prize | null) => void;
  onSkip: () => void;
};

export const BonusGameScreen: React.FC<BonusGameScreenProps> = ({
  gameType,
  earnedStars,
  onComplete,
  onSkip,
}) => {
  const {
    generateWheelResult,
    generateChestPrizes,
    generateScratchGrid,
    WHEEL_PRIZES,
  } = useBonusGame();

  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [wheelResult] = useState(() => generateWheelResult(earnedStars));
  const [chestPrizes] = useState(() => generateChestPrizes(earnedStars));
  const [scratchGrid] = useState<ScratchSymbol[]>(() => generateScratchGrid(earnedStars));

  const titleAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const prizeAnim = useRef(new Animated.Value(0)).current;

  // Entry animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Prize reveal animation
  useEffect(() => {
    if (wonPrize) {
      Animated.spring(prizeAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [wonPrize]);

  const handlePrizeWon = (prize: Prize | null) => {
    setWonPrize(prize);
    setGameComplete(true);
  };

  const handleContinue = () => {
    onComplete(wonPrize);
  };

  const getGameTitle = () => {
    switch (gameType) {
      case 'wheel':
        return 'SPIN TO WIN!';
      case 'chest':
        return 'TREASURE HUNT!';
      case 'scratch':
        return 'SCRATCH & WIN!';
    }
  };

  const getGameIcon = () => {
    switch (gameType) {
      case 'wheel':
        return '🎡';
      case 'chest':
        return '📦';
      case 'scratch':
        return '🎫';
    }
  };

  return (
    <AnimatedBackground particlesEnabled gradientEnabled>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>Skip →</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleAnim,
              transform: [
                {
                  scale: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.gameIcon}>{getGameIcon()}</Text>
          <Text style={styles.title}>BONUS GAME!</Text>
          <Text style={styles.subtitle}>{getGameTitle()}</Text>
        </Animated.View>

        {/* Game Content */}
        <Animated.View
          style={[
            styles.gameContent,
            {
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {gameType === 'wheel' && (
            <SpinWheel
              resultIndex={wheelResult}
              onComplete={handlePrizeWon}
            />
          )}
          {gameType === 'chest' && (
            <TreasureChest
              prizes={chestPrizes}
              onComplete={handlePrizeWon}
            />
          )}
          {gameType === 'scratch' && (
            <ScratchCard
              grid={scratchGrid}
              onComplete={handlePrizeWon}
            />
          )}
        </Animated.View>

        {/* Prize Won Display */}
        {gameComplete && wonPrize && (
          <Animated.View
            style={[
              styles.prizeDisplay,
              {
                opacity: prizeAnim,
                transform: [
                  {
                    scale: prizeAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1.1, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.prizeTitle}>YOU WON!</Text>
            <View style={styles.prizeContent}>
              <Text style={styles.prizeIcon}>{wonPrize.icon}</Text>
              <Text style={styles.prizeLabel}>{wonPrize.label}</Text>
            </View>
          </Animated.View>
        )}

        {/* Continue Button */}
        {gameComplete && (
          <View style={styles.continueContainer}>
            <GlowButton
              title="CONTINUE"
              onPress={handleContinue}
              variant="gold"
              size="large"
            />
          </View>
        )}
      </View>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#888',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  gameIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 4,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 20,
    color: '#FFF',
    marginTop: 8,
    letterSpacing: 2,
  },
  gameContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prizeDisplay: {
    position: 'absolute',
    bottom: 180,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  prizeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
    letterSpacing: 2,
  },
  prizeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prizeIcon: {
    fontSize: 40,
  },
  prizeLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  continueContainer: {
    position: 'absolute',
    bottom: 60,
  },
});
