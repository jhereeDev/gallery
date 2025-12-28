import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success';

/**
 * Trigger haptic feedback on supported devices (iOS and Android)
 */
export const triggerHaptic = (type: HapticType): void => {
  try {
    if (Platform.OS === 'ios') {
      // iOS native haptics
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    } else if (Platform.OS === 'android') {
      // Android vibration patterns
      switch (type) {
        case 'light':
          Vibration.vibrate(10);
          break;
        case 'medium':
          Vibration.vibrate(20);
          break;
        case 'heavy':
          Vibration.vibrate(30);
          break;
        case 'success':
          Vibration.vibrate([0, 50, 50, 50]);
          break;
      }
    }
  } catch (error) {
    // Silently fail if haptics not available
    console.warn('Haptic feedback failed:', error);
  }
};
