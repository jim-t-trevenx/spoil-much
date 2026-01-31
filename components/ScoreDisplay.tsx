import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

type ScoreDisplayProps = {
  score: number;
  combo: number;
};

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, combo }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/score-bg.gif')}
        style={styles.backgroundGif}
        resizeMode="cover"
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.label}>SCORE</Text>
        <Text style={styles.score}>{score.toLocaleString()}</Text>
        {combo > 1 && (
          <Text style={styles.combo}>Combo x{combo}!</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 16,
    color: '#AAA',
    fontWeight: '600',
    letterSpacing: 2,
  },
  score: {
    fontSize: 48,
    color: '#FFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  combo: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
