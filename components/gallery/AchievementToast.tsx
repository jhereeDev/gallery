import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import type { Achievement } from '@/types/gallery';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    translateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    );
    rotate.value = withSequence(
      withTiming(-5, { duration: 100 }),
      withTiming(5, { duration: 200 }),
      withSpring(0, { damping: 10 })
    );

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      translateY.value = withTiming(-150, { duration: 500 });
      opacity.value = withTiming(0, { duration: 400 }, () => {
        runOnJS(onDismiss)();
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value }, 
      { scale: scale.value },
      { rotateZ: `${rotate.value}deg` }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <ThemedText style={styles.icon}>{achievement.icon}</ThemedText>
      <ThemedText style={styles.title}>Achievement Unlocked!</ThemedText>
      <ThemedText style={styles.achievementTitle}>{achievement.title}</ThemedText>
      <ThemedText style={styles.description}>{achievement.description}</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    backgroundColor: '#FFD700', // Gold color for premium feel
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  icon: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
    opacity: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  achievementTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#000',
    opacity: 0.8,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
});
