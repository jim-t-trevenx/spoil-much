import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent, PanResponderGestureState, Animated, Easing, Text } from 'react-native';
import { Block, SwapDirection } from './Block';
import { Board as BoardType } from '../utils/boardUtils';
import { GRID_SIZE, TOTAL_BLOCK_SIZE, BLOCK_SIZE, BLOCK_MARGIN } from '../utils/constants';
import { ExplodingBlock, PowerUpActivations } from '../hooks/useGameLogic';

const BOARD_PADDING = 8;

// Propeller Flying Animation Component with Search Phase
// Phases: Liftoff (150ms) -> Circle Search (600ms) -> Dive (350ms) -> Impact (200ms)
const PropellerFlyingAnimation: React.FC<{
  startRow: number;
  startCol: number;
  targetRow: number;
  targetCol: number;
  color: string;
}> = ({ startRow, startCol, targetRow, targetCol, color }) => {
  // Phase tracking: 0 = liftoff, 1 = search, 2 = dive
  const phase = useRef(new Animated.Value(0)).current;
  const searchProgress = useRef(new Animated.Value(0)).current; // 0-1 for circle
  const diveProgress = useRef(new Animated.Value(0)).current;   // 0-1 for dive to target
  const rotation = useRef(new Animated.Value(0)).current;
  const propellerOpacity = useRef(new Animated.Value(1)).current;
  const liftoffY = useRef(new Animated.Value(0)).current;
  const pulseGlow = useRef(new Animated.Value(0)).current;
  const explosionScale = useRef(new Animated.Value(0)).current;
  const explosionOpacity = useRef(new Animated.Value(0)).current;
  const [showExplosion, setShowExplosion] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'liftoff' | 'search' | 'dive' | 'impact'>('liftoff');

  // Calculate positions
  const startX = startCol * TOTAL_BLOCK_SIZE + BLOCK_SIZE / 2 + BLOCK_MARGIN;
  const startY = startRow * TOTAL_BLOCK_SIZE + BLOCK_SIZE / 2 + BLOCK_MARGIN;
  const endX = targetCol * TOTAL_BLOCK_SIZE + BLOCK_SIZE / 2 + BLOCK_MARGIN;
  const endY = targetRow * TOTAL_BLOCK_SIZE + BLOCK_SIZE / 2 + BLOCK_MARGIN;

  // Circle search parameters
  const circleRadius = 35;
  const hoverHeight = -50; // How high above start to hover

  useEffect(() => {
    // Phase 1: Liftoff (150ms)
    Animated.parallel([
      Animated.timing(liftoffY, {
        toValue: hoverHeight,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 1,
        duration: 150,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentPhase('search');

      // Phase 2: Circle Search (600ms) - 1.5 loops
      Animated.parallel([
        Animated.timing(searchProgress, {
          toValue: 1.5, // 1.5 full circles
          duration: 600,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 7, // Keep spinning
          duration: 600,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Pulsing glow effect during search
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseGlow, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(pulseGlow, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ),
      ]).start(() => {
        setCurrentPhase('dive');

        // Phase 3: Dive to Target (350ms)
        Animated.parallel([
          Animated.timing(diveProgress, {
            toValue: 1,
            duration: 350,
            easing: Easing.in(Easing.quad), // Accelerate into dive
            useNativeDriver: true,
          }),
          Animated.timing(rotation, {
            toValue: 12, // Keep spinning faster
            duration: 350,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCurrentPhase('impact');

          // Phase 4: Impact
          Animated.timing(propellerOpacity, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }).start();

          setShowExplosion(true);
          Animated.parallel([
            Animated.spring(explosionScale, {
              toValue: 1,
              friction: 4,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(explosionOpacity, {
                toValue: 1,
                duration: 50,
                useNativeDriver: true,
              }),
              Animated.timing(explosionOpacity, {
                toValue: 0,
                duration: 150,
                delay: 50,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        });
      });
    });
  }, []);

  // Calculate position based on current phase
  // Circle motion: x = centerX + r*cos(angle), y = centerY + r*sin(angle)
  const circleX = searchProgress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5],
    outputRange: [0, circleRadius, 0, -circleRadius, 0, circleRadius, 0],
  });

  const circleY = searchProgress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5],
    outputRange: [-circleRadius, 0, circleRadius, 0, -circleRadius, 0, circleRadius],
  });

  // Dive position interpolation
  const diveX = diveProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, endX - startX],
  });

  const diveY = diveProgress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, -30, endY - startY - hoverHeight], // Arc up slightly then down to target
  });

  const rotateZ = rotation.interpolate({
    inputRange: [0, 12],
    outputRange: ['0deg', '4320deg'], // Many rotations
  });

  // Scale: grow during liftoff/search, shrink on impact
  const scale = currentPhase === 'dive'
    ? diveProgress.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [1.2, 1.3, 0.6],
      })
    : currentPhase === 'search'
    ? 1.2
    : liftoffY.interpolate({
        inputRange: [hoverHeight, 0],
        outputRange: [1.2, 1],
      });

  // Glow intensity during search
  const glowOpacity = pulseGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  // Build transform based on phase
  const getTransform = () => {
    if (currentPhase === 'liftoff') {
      return [
        { translateX: startX },
        { translateY: Animated.add(startY, liftoffY) },
        { rotate: rotateZ },
        { scale },
      ];
    } else if (currentPhase === 'search') {
      return [
        { translateX: Animated.add(startX, circleX) },
        { translateY: Animated.add(Animated.add(startY, hoverHeight), circleY) },
        { rotate: rotateZ },
        { scale: 1.2 },
      ];
    } else {
      // dive or impact
      return [
        { translateX: Animated.add(startX, diveX) },
        { translateY: Animated.add(Animated.add(startY, hoverHeight), diveY) },
        { rotate: rotateZ },
        { scale },
      ];
    }
  };

  return (
    <View style={styles.propellerContainer} pointerEvents="none">
      {/* Search glow effect */}
      {currentPhase === 'search' && (
        <Animated.View
          style={[
            styles.searchGlow,
            {
              left: startX - 25,
              top: startY + hoverHeight - 25,
              opacity: glowOpacity,
              transform: [
                { translateX: circleX },
                { translateY: circleY },
              ],
            },
          ]}
        />
      )}

      {/* Flying propeller */}
      <Animated.View
        style={[
          styles.flyingPropeller,
          {
            backgroundColor: color,
            opacity: propellerOpacity,
            transform: getTransform() as any,
          },
        ]}
      >
        <Text style={styles.propellerEmoji}>✈</Text>
      </Animated.View>

      {/* Explosion at target */}
      {showExplosion && (
        <Animated.View
          style={[
            styles.propellerExplosion,
            {
              left: endX - 40,
              top: endY - 40,
              transform: [{ scale: explosionScale }],
              opacity: explosionOpacity,
            },
          ]}
        >
          {/* Explosion rings */}
          <View style={[styles.explosionRing, { borderColor: color }]} />
          <View style={[styles.explosionRing, styles.explosionRing2, { borderColor: '#FFF' }]} />
        </Animated.View>
      )}
    </View>
  );
};

export type SwappingPair = {
  from: { row: number; col: number };
  to: { row: number; col: number };
} | null;

type BoardProps = {
  board: BoardType;
  selectedBlock: { row: number; col: number } | null;
  swappingPair: SwappingPair;
  explodingBlocks: ExplodingBlock[];
  powerUpActivations: PowerUpActivations;
  demoMode?: boolean;
  onBlockPress: (row: number, col: number) => void;
  onSwipe: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
  onSwapAnimationComplete: () => void;
};

const getSwapDirection = (
  row: number,
  col: number,
  swappingPair: SwappingPair
): SwapDirection => {
  if (!swappingPair) return null;

  const { from, to } = swappingPair;

  // Check if this block is the "from" block
  if (from.row === row && from.col === col) {
    if (to.col > from.col) return 'right';
    if (to.col < from.col) return 'left';
    if (to.row > from.row) return 'down';
    if (to.row < from.row) return 'up';
  }

  // Check if this block is the "to" block
  if (to.row === row && to.col === col) {
    if (from.col > to.col) return 'right';
    if (from.col < to.col) return 'left';
    if (from.row > to.row) return 'down';
    if (from.row < to.row) return 'up';
  }

  return null;
};

export const Board: React.FC<BoardProps> = ({
  board,
  selectedBlock,
  swappingPair,
  explodingBlocks,
  powerUpActivations,
  demoMode = false,
  onBlockPress,
  onSwipe,
  onSwapAnimationComplete,
}) => {
  const startPos = useRef<{ row: number; col: number } | null>(null);
  const hasSwipedRef = useRef(false);

  // Use refs for callbacks to avoid stale closures in PanResponder
  const onSwipeRef = useRef(onSwipe);
  const onBlockPressRef = useRef(onBlockPress);

  // Keep refs updated
  useEffect(() => {
    onSwipeRef.current = onSwipe;
    onBlockPressRef.current = onBlockPress;
  }, [onSwipe, onBlockPress]);

  const getBlockFromPosition = (x: number, y: number) => {
    const adjustedX = x - BOARD_PADDING;
    const adjustedY = y - BOARD_PADDING;
    const col = Math.floor(adjustedX / TOTAL_BLOCK_SIZE);
    const row = Math.floor(adjustedY / TOTAL_BLOCK_SIZE);

    if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
      return { row, col };
    }
    return null;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const { locationX, locationY } = evt.nativeEvent;
        startPos.current = getBlockFromPosition(locationX, locationY);
        hasSwipedRef.current = false;
      },

      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (!startPos.current || hasSwipedRef.current) return;

        const { dx, dy } = gestureState;

        // Minimum movement to register as intentional
        const minMovement = 5;
        if (Math.abs(dx) < minMovement && Math.abs(dy) < minMovement) return;

        const threshold = TOTAL_BLOCK_SIZE * 0.4;

        let toRow = startPos.current.row;
        let toCol = startPos.current.col;

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > threshold) {
            toCol = startPos.current.col + 1;
          } else if (dx < -threshold) {
            toCol = startPos.current.col - 1;
          }
        } else {
          if (dy > threshold) {
            toRow = startPos.current.row + 1;
          } else if (dy < -threshold) {
            toRow = startPos.current.row - 1;
          }
        }

        if (
          (toRow !== startPos.current.row || toCol !== startPos.current.col) &&
          toRow >= 0 && toRow < GRID_SIZE &&
          toCol >= 0 && toCol < GRID_SIZE
        ) {
          hasSwipedRef.current = true;
          onSwipeRef.current(startPos.current.row, startPos.current.col, toRow, toCol);
        }
      },

      onPanResponderRelease: (evt: GestureResponderEvent) => {
        if (startPos.current && !hasSwipedRef.current) {
          onBlockPressRef.current(startPos.current.row, startPos.current.col);
        }
        startPos.current = null;
        hasSwipedRef.current = false;
      },
    })
  ).current;

  // Track which block's animation we're waiting for
  const animationCompleteCount = useRef(0);

  const handleBlockSwapComplete = () => {
    animationCompleteCount.current += 1;
    // Wait for both blocks to finish animating
    if (animationCompleteCount.current >= 2) {
      animationCompleteCount.current = 0;
      onSwapAnimationComplete();
    }
  };

  // Track active propeller animations
  const [activePropellers, setActivePropellers] = useState<typeof powerUpActivations.propellers>([]);

  useEffect(() => {
    if (powerUpActivations.propellers.length > 0) {
      setActivePropellers(powerUpActivations.propellers);
      const timer = setTimeout(() => setActivePropellers([]), 600);
      return () => clearTimeout(timer);
    }
  }, [powerUpActivations.propellers]);

  return (
    <View style={styles.container}>
      <View style={styles.board} {...(demoMode ? {} : panResponder.panHandlers)}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((block, colIndex) => {
              const swapDir = getSwapDirection(rowIndex, colIndex, swappingPair);
              const exploding = explodingBlocks.find(
                e => e.row === rowIndex && e.col === colIndex
              );
              // Check if this block is activating a rocket
              const rocketActivation = powerUpActivations.rockets.find(
                r => r.row === rowIndex && r.col === colIndex
              );
              // Check if this block is activating a bomb
              const bombActivation = powerUpActivations.bombs.find(
                b => b.row === rowIndex && b.col === colIndex
              );
              // Check if this block is activating a rainbow
              const rainbowActivation = powerUpActivations.rainbows.find(
                r => r.row === rowIndex && r.col === colIndex
              );
              return (
                <Block
                  key={block.id}
                  color={block.color}
                  row={rowIndex}
                  col={colIndex}
                  isSelected={
                    selectedBlock !== null &&
                    selectedBlock.row === rowIndex &&
                    selectedBlock.col === colIndex
                  }
                  swapDirection={swapDir}
                  specialType={block.specialType}
                  isExploding={!!exploding}
                  isRocketExplosion={exploding?.isRocket ?? false}
                  rocketActivation={rocketActivation}
                  bombActivation={bombActivation}
                  rainbowActivation={rainbowActivation}
                  onPress={() => onBlockPress(rowIndex, colIndex)}
                  onSwapAnimationComplete={swapDir ? handleBlockSwapComplete : undefined}
                />
              );
            })}
          </View>
        ))}

        {/* Propeller flying animations */}
        {activePropellers.map((propeller, index) => (
          <PropellerFlyingAnimation
            key={`propeller-${propeller.row}-${propeller.col}-${index}`}
            startRow={propeller.row}
            startCol={propeller.col}
            targetRow={propeller.targetRow}
            targetCol={propeller.targetCol}
            color={board[propeller.row]?.[propeller.col]?.color || '#00BFFF'}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  board: {
    width: GRID_SIZE * TOTAL_BLOCK_SIZE + 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 8,
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    overflow: 'visible',
  },
  // Propeller animation styles
  propellerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible',
    zIndex: 200,
  },
  flyingPropeller: {
    position: 'absolute',
    width: BLOCK_SIZE * 0.8,
    height: BLOCK_SIZE * 0.8,
    marginLeft: -BLOCK_SIZE * 0.4,
    marginTop: -BLOCK_SIZE * 0.4,
    borderRadius: BLOCK_SIZE * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00BFFF',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 15,
  },
  propellerEmoji: {
    fontSize: 20,
    color: '#FFF',
  },
  propellerExplosion: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  explosionRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
  },
  explosionRing2: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  searchGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00BFFF',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
});
