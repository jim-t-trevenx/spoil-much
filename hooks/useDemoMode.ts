import { useEffect, useRef, useCallback } from 'react';
import { Board } from '../utils/boardUtils';
import { getDemoMove } from '../utils/demoAI';

type GameState = 'idle' | 'animating' | 'checking' | 'removing' | 'falling' | 'filling';

type UseDemoModeProps = {
  isActive: boolean;
  board: Board;
  gameState: GameState;
  handleSwipe: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
};

const DEMO_MOVE_DELAY_MIN = 1000; // 1 second minimum
const DEMO_MOVE_DELAY_MAX = 1500; // 1.5 seconds maximum

export const useDemoMode = ({
  isActive,
  board,
  gameState,
  handleSwipe,
}: UseDemoModeProps) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const makeMove = useCallback(() => {
    if (!isActive || gameState !== 'idle') return;

    const move = getDemoMove(board);
    if (move) {
      handleSwipe(move.fromRow, move.fromCol, move.toRow, move.toCol);
    }
  }, [isActive, board, gameState, handleSwipe]);

  useEffect(() => {
    if (!isActive) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Only schedule next move when game is idle
    if (gameState === 'idle') {
      const delay = DEMO_MOVE_DELAY_MIN + Math.random() * (DEMO_MOVE_DELAY_MAX - DEMO_MOVE_DELAY_MIN);
      timeoutRef.current = setTimeout(() => {
        makeMove();
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActive, gameState, makeMove]);

  return null;
};
