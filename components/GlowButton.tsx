import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
} from 'react-native';

type GlowButtonProps = {
  title: string;
  onPress: () => void;
  color?: string;
  glowColor?: string;
  textColor?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'gold' | 'danger';
  disabled?: boolean;
  shimmer?: boolean;
  pulse?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  subtitle?: string;
};

export const GlowButton: React.FC<GlowButtonProps> = ({
  title,
  onPress,
  color,
  glowColor,
  textColor = '#FFFFFF',
  size = 'medium',
  variant = 'primary',
  disabled = false,
  shimmer = true,
  pulse = true,
  style,
  textStyle,
  subtitle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Get colors based on variant
  const getColors = () => {
    switch (variant) {
      case 'gold':
        return {
          bg: color || '#FFD700',
          glow: glowColor || '#FFD700',
          text: textColor || '#000000',
        };
      case 'danger':
        return {
          bg: color || '#FF4444',
          glow: glowColor || '#FF4444',
          text: textColor || '#FFFFFF',
        };
      case 'secondary':
        return {
          bg: color || 'transparent',
          glow: glowColor || 'rgba(255, 255, 255, 0.3)',
          text: textColor || '#AAAAAA',
        };
      default:
        return {
          bg: color || '#4CAF50',
          glow: glowColor || '#4CAF50',
          text: textColor || '#FFFFFF',
        };
    }
  };

  const colors = getColors();

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 10,
          paddingHorizontal: 20,
          fontSize: 14,
          subtitleSize: 10,
        };
      case 'large':
        return {
          paddingVertical: 18,
          paddingHorizontal: 40,
          fontSize: 22,
          subtitleSize: 13,
        };
      default:
        return {
          paddingVertical: 14,
          paddingHorizontal: 32,
          fontSize: 18,
          subtitleSize: 11,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  // Shimmer animation
  useEffect(() => {
    if (shimmer && !disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.delay(1000),
          Animated.timing(shimmerAnim, {
            toValue: -1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => shimmerAnim.stopAnimation();
  }, [shimmer, disabled]);

  // Pulse animation
  useEffect(() => {
    if (pulse && !disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => pulseAnim.stopAnimation();
  }, [pulse, disabled]);

  // Glow animation
  useEffect(() => {
    if (!disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => glowAnim.stopAnimation();
  }, [disabled]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 5,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
          ],
        },
      ]}
    >
      {/* Glow effect */}
      {!disabled && variant !== 'secondary' && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              backgroundColor: colors.glow,
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.6],
              }),
            },
          ]}
        />
      )}

      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          {
            backgroundColor: colors.bg,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            borderWidth: variant === 'secondary' ? 2 : 0,
            borderColor: variant === 'secondary' ? 'rgba(255, 255, 255, 0.3)' : undefined,
            shadowColor: colors.glow,
          },
          disabled && styles.buttonDisabled,
          style,
        ]}
      >
        {/* Shimmer effect */}
        {shimmer && !disabled && (
          <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [
                  {
                    translateX: shimmerAnim.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-150, 150],
                    }),
                  },
                ],
              },
            ]}
          />
        )}

        <Text
          style={[
            styles.text,
            {
              color: colors.text,
              fontSize: sizeStyles.fontSize,
            },
            disabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.text,
                fontSize: sizeStyles.subtitleSize,
                opacity: 0.8,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  text: {
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  textDisabled: {
    opacity: 0.7,
  },
  subtitle: {
    marginTop: 4,
    fontWeight: '500',
  },
});
