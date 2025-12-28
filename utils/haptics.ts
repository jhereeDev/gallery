import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success';

/**
 * Trigger haptic feedback on supported devices (iOS only)
 */
export const triggerHaptic = (type: HapticType): void => {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
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
  } catch (error) {
    // Silently fail if haptics not available
    console.warn('Haptic feedback failed:', error);
  }
};
