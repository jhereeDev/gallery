import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { triggerHaptic } from '@/utils/haptics';
import { SWIPE_THRESHOLD, ROTATION_FACTOR } from '@/constants/config';
import { EXIT_SPRING_CONFIG, SPRING_CONFIG, TIMING_CONFIG } from '@/utils/animations';
import { MetadataPanel } from '@/components/gallery/MetadataPanel';
import type { Photo, PhotoAnalysis } from '@/types/gallery';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.6;

interface SwipeCardProps {
  photo: Photo;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isSuggested?: boolean;
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
  analysis?: PhotoAnalysis;
}

export function SwipeCard({ 
  photo, 
  onSwipeLeft, 
  onSwipeRight, 
  isSuggested = false,
  translateX,
  translateY,
  analysis
}: SwipeCardProps) {
  const deleteColor = useThemeColor({}, 'deleteColor');
  const keepColor = useThemeColor({}, 'keepColor');
  const cardBg = useThemeColor({}, 'cardBackground');

  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Reset local values when photo changes
  useEffect(() => {
    rotate.value = 0;
    opacity.value = withSpring(1, SPRING_CONFIG);
  }, [photo.id]);

  // Derived values for overlays
  const deleteOverlayOpacity = useDerivedValue(() => {
    return translateX.value > 0 ? Math.min(translateX.value / SWIPE_THRESHOLD, 1) : 0;
  });

  const keepOverlayOpacity = useDerivedValue(() => {
    return translateX.value < 0 ? Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1) : 0;
  });

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    triggerHaptic('medium');

    // Animate card out
    translateX.value = withSpring(
      direction === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH,
      EXIT_SPRING_CONFIG
    );
    opacity.value = withTiming(0, TIMING_CONFIG);

    // Trigger callback after animation
    setTimeout(() => {
      if (direction === 'left') {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }, 250);
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(triggerHaptic)('light');
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotate.value = event.translationX / ROTATION_FACTOR;
    })
    .onEnd(() => {
      const shouldDelete = translateX.value > SWIPE_THRESHOLD;
      const shouldKeep = translateX.value < -SWIPE_THRESHOLD;

      if (shouldDelete || shouldKeep) {
        runOnJS(handleSwipeComplete)(shouldDelete ? 'right' : 'left');
      } else {
        // Spring back to center
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        rotate.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotate.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const deleteOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: deleteOverlayOpacity.value,
    };
  });

  const keepOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: keepOverlayOpacity.value,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, { backgroundColor: cardBg }, cardAnimatedStyle]}>
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        {/* Delete Overlay (Right swipe) */}
        <Animated.View style={[styles.overlay, styles.deleteOverlay, deleteOverlayStyle]}>
          <View style={[styles.textContainer, styles.deleteTextContainer]}>
            <ThemedText style={[styles.overlayText, styles.deleteText]}>DELETE</ThemedText>
          </View>
        </Animated.View>

        {/* Keep Overlay (Left swipe) */}
        <Animated.View style={[styles.overlay, styles.keepOverlay, keepOverlayStyle]}>
          <View style={[styles.textContainer, styles.keepTextContainer]}>
            <ThemedText style={[styles.overlayText, styles.keepText]}>KEEP</ThemedText>
          </View>
        </Animated.View>

        {/* Smart Suggestion Badge */}
        {isSuggested && (
          <View style={styles.suggestionBadge}>
            <ThemedText style={styles.suggestionText}>✨ Suggested</ThemedText>
          </View>
        )}

        {/* Photo Metadata */}
        <MetadataPanel photo={photo} analysis={analysis} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden', // Keep overflow hidden for image, but overlays handle their own bounds
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20, // Match card border radius
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // Don't set overflow here - let it respect card's overflow
  },
  deleteOverlay: {
    backgroundColor: 'rgba(255, 59, 48, 0.4)',
  },
  keepOverlay: {
    backgroundColor: 'rgba(52, 199, 89, 0.4)',
  },
  textContainer: {
    borderWidth: 5,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 10, // Increased padding
    backgroundColor: 'rgba(0,0,0,0.2)', // Slightly darker for better visibility
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteTextContainer: {
    borderColor: '#FF3B30',
    transform: [{ rotate: '15deg' }],
  },
  keepTextContainer: {
    borderColor: '#34C759',
    transform: [{ rotate: '-15deg' }],
  },
  overlayText: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
    // --- ROBUST FIXES FOR CLIPPING ---
    lineHeight: 58, // Explicitly set > fontSize
    includeFontPadding: false, // Prevents Android-specific clipping
    textAlignVertical: 'center', // Ensures vertical centering
    // ---------------------------------
  },
  deleteText: {
    color: '#FF3B30',
  },
  keepText: {
    color: '#34C759',
  },
  suggestionBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
});
