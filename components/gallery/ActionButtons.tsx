import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { triggerHaptic } from '@/utils/haptics';
import { SPRING_CONFIG } from '@/utils/animations';

interface ActionButtonsProps {
  onKeep: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function ActionButtons({ onKeep, onDelete, disabled = false }: ActionButtonsProps) {
  const keepColor = useThemeColor({}, 'keepColor');
  const deleteColor = useThemeColor({}, 'deleteColor');

  const keepScale = useSharedValue(1);
  const deleteScale = useSharedValue(1);

  const keepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: keepScale.value }],
  }));

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteScale.value }],
  }));

  const handleKeepPressIn = () => {
    keepScale.value = withSpring(0.92, SPRING_CONFIG);
  };

  const handleKeepPressOut = () => {
    keepScale.value = withSpring(1, SPRING_CONFIG);
  };

  const handleDeletePressIn = () => {
    deleteScale.value = withSpring(0.92, SPRING_CONFIG);
  };

  const handleDeletePressOut = () => {
    deleteScale.value = withSpring(1, SPRING_CONFIG);
  };

  const handleKeep = () => {
    if (disabled) return;
    triggerHaptic('medium');
    onKeep();
  };

  const handleDelete = () => {
    if (disabled) return;
    triggerHaptic('medium');
    onDelete();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.buttonWrapper, keepAnimatedStyle]}>
        <Pressable
          style={[
            styles.button,
            { backgroundColor: keepColor },
            disabled && styles.buttonDisabled,
          ]}
          onPressIn={handleKeepPressIn}
          onPressOut={handleKeepPressOut}
          onPress={handleKeep}
          disabled={disabled}
        >
          <ThemedText style={styles.buttonText}>Keep</ThemedText>
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.buttonWrapper, deleteAnimatedStyle]}>
        <Pressable
          style={[
            styles.button,
            { backgroundColor: deleteColor },
            disabled && styles.buttonDisabled,
          ]}
          onPressIn={handleDeletePressIn}
          onPressOut={handleDeletePressOut}
          onPress={handleDelete}
          disabled={disabled}
        >
          <ThemedText style={styles.buttonText}>Delete</ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
