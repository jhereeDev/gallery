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
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { triggerHaptic } from '@/utils/haptics';
import { SWIPE_THRESHOLD, ROTATION_FACTOR } from '@/constants/config';
import { EXIT_SPRING_CONFIG, SPRING_CONFIG, TIMING_CONFIG } from '@/utils/animations';
import { MetadataPanel } from '@/components/gallery/MetadataPanel';
import type { Photo, PhotoAnalysis, PhotoDecision } from '@/types/gallery';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.92;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

interface SwipeCardProps {
  photo: Photo;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onFavorite?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
  isFavorite?: boolean;
  isSuggested?: boolean;
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
  analysis?: PhotoAnalysis;
  existingDecision?: PhotoDecision;
}

export function SwipeCard({
  photo,
  onSwipeLeft,
  onSwipeRight,
  onFavorite,
  onLongPress,
  onTap,
  isFavorite = false,
  isSuggested = false,
  translateX,
  translateY,
  analysis,
  existingDecision
}: SwipeCardProps) {
  const deleteColor = useThemeColor({}, 'deleteColor');
  const keepColor = useThemeColor({}, 'keepColor');
  const cardBg = useThemeColor({}, 'cardBackground');
  const surfaceColor = useThemeColor({}, 'surface');

  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const favoriteOpacity = useSharedValue(0);

  // Reset local values when photo changes
  useEffect(() => {
    rotate.value = 0;
    scale.value = withSpring(1, SPRING_CONFIG);
    opacity.value = withTiming(1, { duration: 400 });
    favoriteOpacity.value = isFavorite ? 1 : 0;
  }, [photo.id, isFavorite]);

  // Derived values for overlays
  const deleteOverlayOpacity = useDerivedValue(() => {
    return interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
  });

  const keepOverlayOpacity = useDerivedValue(() => {
    return interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
  });

  const favoriteOverlayOpacity = useDerivedValue(() => {
    return interpolate(
      translateY.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
  });

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    triggerHaptic('heavy');

    // Animate card out
    translateX.value = withSpring(
      direction === 'left' ? -SCREEN_WIDTH * 1.5 : SCREEN_WIDTH * 1.5,
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
    }, 200);
  };

  const handleFavorite = () => {
    if (onFavorite) {
      triggerHaptic('success');
      favoriteOpacity.value = withSpring(isFavorite ? 0 : 1, SPRING_CONFIG);
      onFavorite();
    }
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(triggerHaptic)('light');
      scale.value = withSpring(1.02, SPRING_CONFIG);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotate.value = event.translationX / ROTATION_FACTOR;
      
      // Haptic feedback when crossing threshold
      if (Math.abs(event.translationX) >= SWIPE_THRESHOLD && Math.abs(event.translationX) < SWIPE_THRESHOLD + 5) {
        runOnJS(triggerHaptic)('medium');
      }
      if (event.translationY < -SWIPE_THRESHOLD && event.translationY > -SWIPE_THRESHOLD - 5) {
        runOnJS(triggerHaptic)('medium');
      }
    })
    .onEnd(() => {
      const shouldDelete = translateX.value > SWIPE_THRESHOLD;
      const shouldKeep = translateX.value < -SWIPE_THRESHOLD;
      const shouldFavorite = translateY.value < -SWIPE_THRESHOLD;

      if (shouldFavorite && onFavorite) {
        runOnJS(handleFavorite)();
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        rotate.value = withSpring(0, SPRING_CONFIG);
        scale.value = withSpring(1, SPRING_CONFIG);
      } else if (shouldDelete || shouldKeep) {
        runOnJS(handleSwipeComplete)(shouldDelete ? 'right' : 'left');
      } else {
        // Spring back to center
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        rotate.value = withSpring(0, SPRING_CONFIG);
        scale.value = withSpring(1, SPRING_CONFIG);
      }
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(triggerHaptic)('medium');
      if (onLongPress) {
        runOnJS(onLongPress)();
      }
    });

  const tapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (onTap) {
        runOnJS(triggerHaptic)('light');
        runOnJS(onTap)();
      }
    });

  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(panGesture, longPressGesture),
    tapGesture
  );

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const s = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [scale.value, 0.95],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotate.value}deg` },
        { scale: s },
      ],
      opacity: opacity.value,
      shadowOpacity: interpolate(
        Math.abs(translateX.value),
        [0, SWIPE_THRESHOLD],
        [0.3, 0.5],
        Extrapolation.CLAMP
      ),
    };
  });

  const deleteOverlayStyle = useAnimatedStyle(() => ({
    opacity: deleteOverlayOpacity.value,
    transform: [{ scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.5, 1.2], Extrapolation.CLAMP) }]
  }));

  const keepOverlayStyle = useAnimatedStyle(() => ({
    opacity: keepOverlayOpacity.value,
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1.2, 0.5], Extrapolation.CLAMP) }]
  }));

  const favoriteOverlayStyle = useAnimatedStyle(() => ({
    opacity: favoriteOverlayOpacity.value,
    transform: [{ scale: interpolate(translateY.value, [-SWIPE_THRESHOLD, 0], [1.2, 0.5], Extrapolation.CLAMP) }]
  }));

  const favoriteBadgeStyle = useAnimatedStyle(() => ({
    opacity: favoriteOpacity.value,
  }));

  const accentColor = useThemeColor({}, 'accent');

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.card, { backgroundColor: cardBg }, cardAnimatedStyle]}>
        <Image
          source={{ uri: photo.uri }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />

        {/* Action Indicators (Icons) */}
        <Animated.View pointerEvents="none" style={[styles.indicatorContainer, styles.deleteIndicator, deleteOverlayStyle]}>
          <View style={[styles.iconCircle, { borderColor: deleteColor }]}>
            <Ionicons name="trash" size={60} color={deleteColor} />
          </View>
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.indicatorContainer, styles.keepIndicator, keepOverlayStyle]}>
          <View style={[styles.iconCircle, { borderColor: keepColor }]}>
            <Ionicons name="heart" size={60} color={keepColor} />
          </View>
        </Animated.View>

        {/* Favorite Indicator (Swipe Up) */}
        {onFavorite && (
          <Animated.View pointerEvents="none" style={[styles.indicatorContainer, styles.favoriteIndicator, favoriteOverlayStyle]}>
            <View style={[styles.iconCircle, { borderColor: accentColor }]}>
              <Ionicons name="star" size={60} color={accentColor} />
            </View>
          </Animated.View>
        )}

        {/* Favorite Badge */}
        {isFavorite && (
          <Animated.View style={[styles.favoriteBadge, favoriteBadgeStyle]}>
            <Ionicons name="star" size={20} color="#fff" />
          </Animated.View>
        )}

        {/* Smart Suggestion Badge */}
        {isSuggested && !existingDecision && (
          <View style={styles.suggestionBadge}>
            <Ionicons name="sparkles" size={14} color="#000" />
            <ThemedText style={styles.suggestionText}>SMART SUGGESTION</ThemedText>
          </View>
        )}

        {/* Already Decided Badge */}
        {existingDecision && (
          <View style={[
            styles.decisionBadge,
            { backgroundColor: existingDecision === 'keep' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)' }
          ]}>
            <Ionicons
              name={existingDecision === 'keep' ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color="#fff"
            />
            <ThemedText style={styles.decisionText}>
              {existingDecision === 'keep' ? 'ALREADY KEPT' : 'ALREADY DELETED'}
            </ThemedText>
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
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  indicatorContainer: {
    position: 'absolute',
    top: '35%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  deleteIndicator: {
    right: 0,
  },
  keepIndicator: {
    left: 0,
  },
  favoriteIndicator: {
    top: '20%',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  suggestionBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  decisionBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  decisionText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.2,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
