import React from 'react';
import { Modal, StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  destructive?: boolean;
}

interface QuickActionsMenuProps {
  visible: boolean;
  actions: QuickAction[];
  onClose: () => void;
}

export function QuickActionsMenu({ visible, actions, onClose }: QuickActionsMenuProps) {
  const backgroundColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const deleteColor = useThemeColor({}, 'deleteColor');
  const keepColor = useThemeColor({}, 'keepColor');
  const accentColor = useThemeColor({}, 'accent');

  if (!visible || actions.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.backdrop}
        />
      </Pressable>

      <Animated.View
        entering={SlideInDown.duration(300)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.container, { backgroundColor }]}
      >
        {actions.map((action, index) => {
          const color = action.destructive
            ? deleteColor
            : action.color || (action.label.toLowerCase().includes('keep') ? keepColor : accentColor);

          return (
            <Pressable
              key={index}
              style={styles.actionButton}
              onPress={() => {
                action.onPress();
                onClose();
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                <Ionicons name={action.icon} size={24} color={color} />
              </View>
              <ThemedText style={styles.actionLabel}>{action.label}</ThemedText>
            </Pressable>
          );
        })}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
});

