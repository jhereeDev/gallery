import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { triggerHaptic } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface UndoButtonProps {
  onPress: () => void;
  disabled?: boolean;
  count?: number;
}

export function UndoButton({ onPress, disabled = false, count = 0 }: UndoButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    triggerHaptic('medium');
    onPress();
  };

  if (disabled) {
    return null; // Hide button when disabled
  }

  return (
    <AnimatedPressable
      style={[styles.button, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <ThemedText style={styles.icon}>↶</ThemedText>
      <ThemedText style={styles.text}>
        Undo {count > 0 && `(${count})`}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    backgroundColor: '#007AFF',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
  },
  icon: {
    fontSize: 20,
    color: '#fff',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
