import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Prize, ScratchSymbol } from '../../hooks/useBonusGame';

type ScratchCardProps = {
  grid: ScratchSymbol[];
  onComplete: (prize: Prize | null) => void;
};

const ScratchCell: React.FC<{
  symbol: ScratchSymbol;
  index: number;
  onScratch: () => void;
  isScratched: boolean;
  isWinning: boolean;
}> = ({ symbol, index, onScratch, isScratched, isWinning }) => {
  const scratchAnim = useRef(new Animated.Value(0)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const winGlowAnim = useRef(new Animated.Value(0)).current;

  // Shimmer animation on unscratched cells
  useEffect(() => {
    if (!isScratched) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isScratched]);

  // Scratch animation
  useEffect(() => {
    if (isScratched) {
      shimmerAnim.stopAnimation();

      Animated.sequence([
        Animated.timing(scratchAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(revealAnim, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isScratched]);

  // Winning glow animation
  useEffect(() => {
    if (isWinning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(winGlowAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(winGlowAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isWinning]);

  return (
    <TouchableOpacity
      style={styles.cell}
      onPress={onScratch}
      disabled={isScratched}
      activeOpacity={0.8}
    >
      {/* Winning glow */}
      {isWinning && (
        <Animated.View
          style={[
            styles.winGlow,
            {
              opacity: winGlowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        />
      )}

      {/* Revealed symbol */}
      <Animated.View
        style={[
          styles.symbolContainer,
          {
            opacity: revealAnim,
            transform: [
              {
                scale: revealAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[styles.symbol, isWinning && styles.symbolWinning]}>
          {symbol.icon}
        </Text>
      </Animated.View>

      {/* Scratch coating */}
      <Animated.View
        style={[
          styles.coating,
          {
            opacity: scratchAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            transform: [
              {
                scale: scratchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.2],
                }),
              },
            ],
          },
        ]}
      >
        {/* Shimmer effect */}
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [
                {
                  translateX: shimmerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-80, 80],
                  }),
                },
              ],
            },
          ]}
        />
        <Text style={styles.scratchText}>?</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const ScratchCard: React.FC<ScratchCardProps> = ({ grid, onComplete }) => {
  const [scratched, setScratched] = useState<boolean[]>(Array(6).fill(false));
  const [winner, setWinner] = useState<Prize | null>(null);
  const [winningIndices, setWinningIndices] = useState<number[]>([]);
  const cardGlowAnim = useRef(new Animated.Value(0)).current;

  // Card glow animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardGlowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(cardGlowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleScratch = (index: number) => {
    const newScratched = [...scratched];
    newScratched[index] = true;
    setScratched(newScratched);

    // Check for winner when all scratched
    const allScratched = newScratched.every(s => s);
    if (allScratched) {
      // Find matching symbols
      const counts: Record<string, number[]> = {};
      grid.forEach((symbol, i) => {
        if (!counts[symbol.id]) counts[symbol.id] = [];
        counts[symbol.id].push(i);
      });

      // Check for 3 matches
      for (const [id, indices] of Object.entries(counts)) {
        if (indices.length >= 3) {
          const symbol = grid.find(s => s.id === id);
          if (symbol) {
            setWinner(symbol.prize);
            setWinningIndices(indices.slice(0, 3));

            setTimeout(() => {
              onComplete(symbol.prize);
            }, 1500);
            return;
          }
        }
      }

      // No winner
      setTimeout(() => {
        onComplete(null);
      }, 1000);
    }
  };

  const scratchedCount = scratched.filter(s => s).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scratch to reveal!</Text>
      <Text style={styles.subtitle}>Match 3 symbols to win</Text>

      <Animated.View
        style={[
          styles.cardGlow,
          {
            opacity: cardGlowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.5],
            }),
          },
        ]}
      />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>LUCKY SCRATCH</Text>
        </View>

        <View style={styles.grid}>
          {grid.map((symbol, index) => (
            <ScratchCell
              key={index}
              symbol={symbol}
              index={index}
              onScratch={() => handleScratch(index)}
              isScratched={scratched[index]}
              isWinning={winningIndices.includes(index)}
            />
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.progress}>{scratchedCount}/6 revealed</Text>
        </View>
      </View>

      {winner && (
        <Animated.View style={styles.winnerBanner}>
          <Text style={styles.winnerText}>YOU WON!</Text>
          <Text style={styles.winnerPrize}>{winner.icon} {winner.label}</Text>
        </Animated.View>
      )}
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
    marginBottom: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAA',
    marginBottom: 30,
  },
  cardGlow: {
    position: 'absolute',
    width: 280,
    height: 340,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    top: 80,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#FFD700',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  cardHeader: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    letterSpacing: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    justifyContent: 'center',
  },
  cell: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#2a2a4e',
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coating: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#C0C0C0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    width: 40,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ skewX: '-20deg' }],
  },
  scratchText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#888',
  },
  symbolContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 36,
  },
  symbolWinning: {
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  winGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 10,
  },
  cardFooter: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  progress: {
    fontSize: 14,
    color: '#888',
  },
  winnerBanner: {
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  winnerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 2,
  },
  winnerPrize: {
    fontSize: 20,
    color: '#FFF',
    marginTop: 8,
  },
});
