import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { triggerHaptic } from '@/utils/haptics';

interface ActionButtonsProps {
  onKeep: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function ActionButtons({ onKeep, onDelete, disabled = false }: ActionButtonsProps) {
  const keepColor = useThemeColor({}, 'keepColor');
  const deleteColor = useThemeColor({}, 'deleteColor');

  const handleKeep = () => {
    triggerHaptic('medium');
    onKeep();
  };

  const handleDelete = () => {
    triggerHaptic('medium');
    onDelete();
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.button,
          { backgroundColor: keepColor },
          disabled && styles.buttonDisabled,
        ]}
        onPress={handleKeep}
        disabled={disabled}
      >
        <ThemedText style={styles.buttonText}>Keep</ThemedText>
      </Pressable>

      <Pressable
        style={[
          styles.button,
          { backgroundColor: deleteColor },
          disabled && styles.buttonDisabled,
        ]}
        onPress={handleDelete}
        disabled={disabled}
      >
        <ThemedText style={styles.buttonText}>Delete</ThemedText>
      </Pressable>
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
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
