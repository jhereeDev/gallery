import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/use-theme-color';
import { triggerHaptic } from '@/utils/haptics';
import { SPRING_CONFIG } from '@/utils/animations';
import { Ionicons } from '@expo/vector-icons';

interface ActionButtonsProps {
  onKeep: () => void;
  onDelete: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
}

export function ActionButtons({ 
  onKeep, 
  onDelete, 
  onUndo, 
  canUndo = false, 
  disabled = false 
}: ActionButtonsProps) {
  const keepColor = useThemeColor({}, 'keepColor');
  const deleteColor = useThemeColor({}, 'deleteColor');
  const surfaceColor = useThemeColor({}, 'surface');
  const tintColor = useThemeColor({}, 'tint');

  const keepScale = useSharedValue(1);
  const deleteScale = useSharedValue(1);
  const undoScale = useSharedValue(1);

  const keepAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: keepScale.value }],
  }));

  const deleteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deleteScale.value }],
  }));

  const undoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: undoScale.value }],
    opacity: canUndo ? 1 : 0.3,
  }));

  const handlePressIn = (scale: Animated.SharedValue<number>) => {
    scale.value = withSpring(0.85, SPRING_CONFIG);
  };

  const handlePressOut = (scale: Animated.SharedValue<number>) => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  return (
    <View style={styles.container}>
      {/* Undo Button */}
      <Animated.View style={[styles.undoWrapper, undoAnimatedStyle]}>
        <Pressable
          style={[styles.smallButton, { backgroundColor: surfaceColor }]}
          onPressIn={() => handlePressIn(undoScale)}
          onPressOut={() => handlePressOut(undoScale)}
          onPress={() => {
            if (canUndo && onUndo) {
              triggerHaptic('medium');
              onUndo();
            }
          }}
          disabled={!canUndo || disabled}
        >
          <Ionicons name="arrow-undo" size={24} color={canUndo ? tintColor : '#94a3b8'} />
        </Pressable>
      </Animated.View>

      <View style={styles.mainButtons}>
        {/* Keep Button */}
        <Animated.View style={[styles.buttonWrapper, keepAnimatedStyle]}>
          <Pressable
            style={[
              styles.button,
              { backgroundColor: surfaceColor, borderColor: keepColor },
              disabled && styles.buttonDisabled,
            ]}
            onPressIn={() => handlePressIn(keepScale)}
            onPressOut={() => handlePressOut(keepScale)}
            onPress={() => {
              if (!disabled) {
                triggerHaptic('medium');
                onKeep();
              }
            }}
            disabled={disabled}
          >
            <Ionicons name="heart" size={32} color={keepColor} />
          </Pressable>
        </Animated.View>

        {/* Delete Button */}
        <Animated.View style={[styles.buttonWrapper, deleteAnimatedStyle]}>
          <Pressable
            style={[
              styles.button,
              { backgroundColor: surfaceColor, borderColor: deleteColor },
              disabled && styles.buttonDisabled,
            ]}
            onPressIn={() => handlePressIn(deleteScale)}
            onPressOut={() => handlePressOut(deleteScale)}
            onPress={() => {
              if (!disabled) {
                triggerHaptic('medium');
                onDelete();
              }
            }}
            disabled={disabled}
          >
            <Ionicons name="trash" size={32} color={deleteColor} />
          </Pressable>
        </Animated.View>
      </View>
      
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
    gap: 20,
  },
  mainButtons: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  buttonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  undoWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  spacer: {
    width: 48, // To balance the undo button on the left
  }
});
