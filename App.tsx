import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Board } from './components/Board';
import { ScoreDisplay } from './components/ScoreDisplay';
import { useGameLogic, GameMode } from './hooks/useGameLogic';
import { useHighScores, HighScore } from './hooks/useHighScores';
import { Difficulty } from './utils/boardUtils';
import { LevelConfig, ObjectiveProgress, getObjectiveText, getColorName } from './types/level';
import { COLORS } from './utils/constants';
import { getLevel, getNextLevelId, WORLDS, getTotalLevelCount } from './data/levels';

type Screen = 'home' | 'game' | 'levels';

// Get obstacle icon/emoji for display
const getObstacleIcon = (obstacle: string): string => {
  switch (obstacle) {
    case 'box': return '📦';
    case 'ice': return '🧊';
    case 'chain': return '⛓️';
    case 'grass': return '🌿';
    case 'blocker': return '🪨';
    default: return '❓';
  }
};

// Objectives Panel Component
function ObjectivesPanel({ objectives }: { objectives: ObjectiveProgress[] }) {
  if (objectives.length === 0) return null;

  return (
    <View style={styles.objectivesPanel}>
      <Text style={styles.objectivesTitle}>OBJECTIVES</Text>
      <View style={styles.objectivesList}>
        {objectives.map((progress, index) => (
          <View key={index} style={styles.objectiveItem}>
            {progress.objective.type === 'clearColor' && (
              <View
                style={[
                  styles.objectiveColorDot,
                  { backgroundColor: progress.objective.color },
                ]}
              />
            )}
            {progress.objective.type === 'clearObstacle' && (
              <Text style={styles.objectiveIcon}>
                {getObstacleIcon(progress.objective.obstacle)}
              </Text>
            )}
            <View style={styles.objectiveTextContainer}>
              <Text
                style={[
                  styles.objectiveText,
                  progress.completed && styles.objectiveTextCompleted,
                ]}
              >
                {progress.objective.type === 'clearColor'
                  ? `${getColorName(progress.objective.color)}`
                  : progress.objective.type === 'clearObstacle'
                    ? `Clear ${progress.objective.obstacle}`
                    : getObjectiveText(progress.objective)}
              </Text>
              <Text
                style={[
                  styles.objectiveProgress,
                  progress.completed && styles.objectiveProgressCompleted,
                ]}
              >
                {progress.current}/{progress.target}
              </Text>
            </View>
            {progress.completed && (
              <Text style={styles.objectiveCheck}>✓</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function HomeScreen({
  onPlay,
  onDemo,
  highScores,
}: {
  onPlay: (difficulty: Difficulty, gameMode: GameMode) => void;
  onDemo: () => void;
  highScores: HighScore[];
}) {
  return (
    <View style={styles.homeContainer}>
      <Text style={styles.title}>SPOIL MUCH</Text>
      <Text style={styles.subtitle}>A Match-3 Puzzle Game</Text>

      <Text style={styles.modeLabel}>CLASSIC MODE</Text>
      <Text style={styles.modeSubLabel}>Complete levels with limited moves</Text>
      <View style={styles.modeButtons}>
        <TouchableOpacity
          style={[styles.modeButton, styles.easyButton]}
          onPress={() => onPlay('easy', 'classic')}
        >
          <Text style={styles.modeButtonText}>EASY</Text>
          <Text style={styles.modeDescription}>Start with rockets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, styles.mediumButton]}
          onPress={() => onPlay('medium', 'classic')}
        >
          <Text style={styles.modeButtonText}>MEDIUM</Text>
          <Text style={styles.modeDescription}>No power-ups</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.modeLabel, { marginTop: 24 }]}>ARCADE MODE</Text>
      <Text style={styles.modeSubLabel}>Race against the clock</Text>
      <View style={styles.modeButtons}>
        <TouchableOpacity
          style={[styles.modeButton, styles.arcadeButton]}
          onPress={() => onPlay('easy', 'arcade')}
        >
          <Text style={styles.modeButtonText}>60 SEC</Text>
          <Text style={styles.modeDescription}>Timed challenge</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.demoButton} onPress={onDemo}>
        <Text style={styles.demoButtonText}>WATCH DEMO</Text>
        <Text style={styles.demoDescription}>See the game play itself</Text>
      </TouchableOpacity>

      {highScores.length > 0 && (
        <View style={styles.highScoresContainer}>
          <Text style={styles.highScoresTitle}>TOP 5 HIGH SCORES</Text>
          {highScores.map((entry, index) => (
            <View key={index} style={styles.scoreRow}>
              <Text style={styles.scoreRank}>#{index + 1}</Text>
              <Text style={styles.scoreValue}>{entry.score.toLocaleString()}</Text>
              <Text style={styles.scoreDate}>{entry.date}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function GameScreen({
  onBack,
  onSaveScore,
  onNextLevel,
  difficulty,
  gameMode = 'classic',
  demoMode = false,
  levelConfig,
}: {
  onBack: () => void;
  onSaveScore: (score: number) => void;
  onNextLevel?: () => void;
  difficulty: Difficulty;
  gameMode?: GameMode;
  demoMode?: boolean;
  levelConfig?: LevelConfig;
}) {
  const {
    board,
    score,
    selectedBlock,
    combo,
    swappingPair,
    explodingBlocks,
    powerUpActivations,
    timeRemaining,
    movesRemaining,
    isGameOver,
    isLevelComplete,
    objectiveProgress,
    handleBlockPress,
    handleSwipe,
    handleSwapAnimationComplete,
    resetGame,
  } = useGameLogic({ difficulty, demoMode, gameMode, levelConfig });

  const handleBack = () => {
    if (!demoMode && score > 0) {
      onSaveScore(score);
    }
    onBack();
  };

  const handleReset = () => {
    if (score > 0) {
      onSaveScore(score);
    }
    resetGame();
  };

  const handleGameOverBack = () => {
    onSaveScore(score);
    onBack();
  };

  const handlePlayAgain = () => {
    onSaveScore(score);
    resetGame();
  };

  const handleLevelCompleteBack = () => {
    onSaveScore(score);
    onBack();
  };

  const handleNextLevel = () => {
    onSaveScore(score);
    if (onNextLevel) {
      onNextLevel();
    } else {
      resetGame();
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.gameContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>{demoMode ? '← Exit Demo' : '← Back'}</Text>
        </TouchableOpacity>

        {/* Timer Display (Arcade Mode) */}
        {!demoMode && gameMode === 'arcade' && timeRemaining !== null && (
          <View style={[styles.timerBadge, timeRemaining <= 10 && styles.timerWarning]}>
            <Text style={[styles.timerText, timeRemaining <= 10 && styles.timerTextWarning]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        )}

        {/* Moves Display (Classic Mode) */}
        {!demoMode && gameMode === 'classic' && movesRemaining !== null && (
          <View style={[styles.movesBadge, movesRemaining <= 5 && styles.movesWarning]}>
            <Text style={[styles.movesText, movesRemaining <= 5 && styles.movesTextWarning]}>
              {movesRemaining} moves
            </Text>
          </View>
        )}

        {demoMode && (
          <View style={[styles.difficultyBadge, styles.demoBadge]}>
            <Text style={styles.difficultyText}>DEMO</Text>
          </View>
        )}

        {!demoMode && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
        {demoMode && <View style={styles.resetButton} />}
      </View>

      <ScoreDisplay score={score} combo={combo} />

      {/* Objectives Panel */}
      {objectiveProgress.length > 0 && (
        <ObjectivesPanel objectives={objectiveProgress} />
      )}

      <Board
        board={board}
        selectedBlock={selectedBlock}
        swappingPair={swappingPair}
        explodingBlocks={explodingBlocks}
        powerUpActivations={powerUpActivations}
        demoMode={demoMode}
        onBlockPress={handleBlockPress}
        onSwipe={handleSwipe}
        onSwapAnimationComplete={handleSwapAnimationComplete}
      />

      <Text style={styles.instructions}>
        {demoMode
          ? 'Watching AI play automatically.\nTap "Exit Demo" to return home.'
          : 'Swipe blocks to swap them.\nMatch 3 or more of the same color!'}
      </Text>

      {/* Game Over Overlay */}
      {isGameOver && !isLevelComplete && (
        <View style={styles.gameOverOverlay}>
          <View style={styles.gameOverModal}>
            <Text style={styles.gameOverTitle}>
              {gameMode === 'arcade' ? "TIME'S UP!" : 'NO MOVES LEFT!'}
            </Text>
            <Text style={styles.gameOverScore}>Final Score</Text>
            <Text style={styles.gameOverScoreValue}>{score.toLocaleString()}</Text>
            <View style={styles.gameOverButtons}>
              <TouchableOpacity style={styles.gameOverButton} onPress={handlePlayAgain}>
                <Text style={styles.gameOverButtonText}>PLAY AGAIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gameOverButton, styles.gameOverButtonSecondary]} onPress={handleGameOverBack}>
                <Text style={styles.gameOverButtonTextSecondary}>HOME</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Level Complete Overlay */}
      {isLevelComplete && (
        <View style={styles.gameOverOverlay}>
          <View style={[styles.gameOverModal, styles.levelCompleteModal]}>
            <Text style={styles.levelCompleteTitle}>LEVEL COMPLETE!</Text>
            <Text style={styles.gameOverScore}>Score</Text>
            <Text style={styles.gameOverScoreValue}>{score.toLocaleString()}</Text>
            {movesRemaining !== null && movesRemaining > 0 && (
              <Text style={styles.movesBonus}>
                +{movesRemaining} moves remaining!
              </Text>
            )}
            <View style={styles.gameOverButtons}>
              <TouchableOpacity style={[styles.gameOverButton, styles.nextLevelButton]} onPress={handleNextLevel}>
                <Text style={styles.gameOverButtonText}>NEXT LEVEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gameOverButton, styles.gameOverButtonSecondary]} onPress={handleLevelCompleteBack}>
                <Text style={styles.gameOverButtonTextSecondary}>HOME</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Levels Screen Component
function LevelsScreen({
  onSelectLevel,
  onBack,
}: {
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}) {
  const totalLevels = getTotalLevelCount();
  const levelButtons = Array.from({ length: totalLevels }, (_, i) => i + 1);

  return (
    <View style={styles.levelsContainer}>
      <View style={styles.levelsHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.levelsTitle}>SELECT LEVEL</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.levelsGrid}>
        {WORLDS.map(world => (
          <View key={world.id} style={styles.worldSection}>
            <Text style={styles.worldTitle}>{world.name}</Text>
            <View style={styles.worldLevels}>
              {world.levels.map(levelId => {
                const level = getLevel(levelId);
                return (
                  <TouchableOpacity
                    key={levelId}
                    style={styles.levelButton}
                    onPress={() => onSelectLevel(levelId)}
                  >
                    <Text style={styles.levelNumber}>{levelId}</Text>
                    {level?.name && (
                      <Text style={styles.levelName} numberOfLines={1}>
                        {level.name}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [demoMode, setDemoMode] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig | undefined>(undefined);
  const { highScores, saveHighScore } = useHighScores();

  const handleSaveScore = async (score: number) => {
    await saveHighScore(score);
  };

  const handlePlay = (selectedDifficulty: Difficulty, selectedGameMode: GameMode) => {
    setDifficulty(selectedDifficulty);
    setGameMode(selectedGameMode);
    setDemoMode(false);

    if (selectedGameMode === 'classic') {
      // Go to level select for classic mode
      setScreen('levels');
    } else {
      // Arcade mode starts immediately
      setCurrentLevel(undefined);
      setGameKey(prev => prev + 1);
      setScreen('game');
    }
  };

  const handleSelectLevel = (levelId: number) => {
    const level = getLevel(levelId);
    setCurrentLevelId(levelId);
    setCurrentLevel(level);
    setGameKey(prev => prev + 1);
    setScreen('game');
  };

  const handleNextLevel = () => {
    const nextId = getNextLevelId(currentLevelId);
    if (nextId) {
      handleSelectLevel(nextId);
    } else {
      // No more levels, go back to level select
      setScreen('levels');
    }
  };

  const handleDemo = () => {
    setDifficulty('easy');
    setGameMode('arcade');
    setDemoMode(true);
    setCurrentLevel(undefined);
    setGameKey(prev => prev + 1);
    setScreen('game');
  };

  const handleBack = () => {
    setDemoMode(false);
    setScreen('home');
  };

  const handleBackToLevels = () => {
    setScreen('levels');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {screen === 'home' && (
        <HomeScreen onPlay={handlePlay} onDemo={handleDemo} highScores={highScores} />
      )}
      {screen === 'levels' && (
        <LevelsScreen onSelectLevel={handleSelectLevel} onBack={handleBack} />
      )}
      {screen === 'game' && (
        <GameScreen
          key={gameKey}
          onBack={gameMode === 'classic' ? handleBackToLevels : handleBack}
          onSaveScore={handleSaveScore}
          onNextLevel={handleNextLevel}
          difficulty={difficulty}
          gameMode={gameMode}
          demoMode={demoMode}
          levelConfig={currentLevel}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  homeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#AAA',
    marginBottom: 40,
  },
  modeLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
    letterSpacing: 2,
  },
  modeSubLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  modeButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  easyButton: {
    backgroundColor: '#00CC00',
    shadowColor: '#00CC00',
  },
  mediumButton: {
    backgroundColor: '#0066FF',
    shadowColor: '#0066FF',
  },
  arcadeButton: {
    backgroundColor: '#FF6600',
    shadowColor: '#FF6600',
  },
  demoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAA',
    letterSpacing: 2,
  },
  demoDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  modeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  modeDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  highScoresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
  },
  highScoresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoreRank: {
    fontSize: 14,
    color: '#888',
    width: 30,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  scoreDate: {
    fontSize: 12,
    color: '#666',
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#AAA',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  easyBadge: {
    backgroundColor: 'rgba(0, 204, 0, 0.3)',
  },
  mediumBadge: {
    backgroundColor: 'rgba(0, 102, 255, 0.3)',
  },
  demoBadge: {
    backgroundColor: 'rgba(255, 165, 0, 0.3)',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 1,
  },
  resetButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  instructions: {
    marginTop: 30,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Timer styles
  timerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  timerWarning: {
    backgroundColor: 'rgba(255, 50, 50, 0.3)',
    borderColor: '#FF3232',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    fontVariant: ['tabular-nums'],
  },
  timerTextWarning: {
    color: '#FF3232',
  },
  // Moves counter styles
  movesBadge: {
    backgroundColor: 'rgba(100, 100, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(100, 100, 255, 0.4)',
  },
  movesWarning: {
    backgroundColor: 'rgba(255, 150, 50, 0.3)',
    borderColor: '#FF9632',
  },
  movesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  movesTextWarning: {
    color: '#FF9632',
  },
  // Objectives Panel styles
  objectivesPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    minWidth: 200,
  },
  objectivesTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  objectivesList: {
    gap: 6,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 8,
  },
  objectiveColorDot: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  objectiveIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  objectiveTextContainer: {
    flex: 1,
  },
  objectiveText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '500',
  },
  objectiveTextCompleted: {
    color: '#4CAF50',
  },
  objectiveProgress: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 2,
  },
  objectiveProgressCompleted: {
    color: '#4CAF50',
  },
  objectiveCheck: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Level Complete styles
  levelCompleteModal: {
    borderColor: '#4CAF50',
  },
  levelCompleteTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 24,
    letterSpacing: 2,
  },
  movesBonus: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 16,
  },
  nextLevelButton: {
    backgroundColor: '#4CAF50',
  },
  // Game Over styles
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 280,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 24,
    letterSpacing: 2,
  },
  gameOverScore: {
    fontSize: 16,
    color: '#888',
    marginBottom: 8,
  },
  gameOverScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 32,
  },
  gameOverButtons: {
    gap: 12,
    width: '100%',
  },
  gameOverButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  gameOverButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gameOverButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1,
  },
  gameOverButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#AAA',
    letterSpacing: 1,
  },
  // Levels Screen styles
  levelsContainer: {
    flex: 1,
    paddingTop: 20,
  },
  levelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  levelsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
  },
  levelsGrid: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  worldSection: {
    marginBottom: 24,
  },
  worldTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  worldLevels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  levelButton: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  levelName: {
    fontSize: 8,
    color: '#AAA',
    marginTop: 2,
  },
});
