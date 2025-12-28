import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import type { Photo } from '@/types/gallery';
import { SWIPE_THRESHOLD } from '@/constants/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.6;

interface PhotoStackProps {
  photos: Photo[];
  currentIndex: number;
  translateX: Animated.SharedValue<number>;
}

export function PhotoStack({ photos, currentIndex, translateX }: PhotoStackProps) {
  // Show next 2 photos behind the current one
  const stackPhotos = photos.slice(currentIndex + 1, currentIndex + 3);

  if (stackPhotos.length === 0) {
    return null;
  }

  return (
    <>
      {stackPhotos.reverse().map((photo, reverseIndex) => {
        const index = stackPhotos.length - 1 - reverseIndex;
        const stackIndex = index + 1;

        return <StackCard key={photo.id} photo={photo} stackIndex={stackIndex} translateX={translateX} />;
      })}
    </>
  );
}

function StackCard({ 
  photo, 
  stackIndex, 
  translateX 
}: { 
  photo: Photo; 
  stackIndex: number; 
  translateX: Animated.SharedValue<number> 
}) {
  const animatedStyle = useAnimatedStyle(() => {
    // As the top card swiped, background cards move up and scale up
    const swipeProgress = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    
    // Scale: 1 - stackIndex * 0.03 (base) -> improves as swipe progresses
    const baseScale = 1 - stackIndex * 0.04;
    const nextScale = 1 - (stackIndex - 1) * 0.04;
    const scale = interpolate(
      swipeProgress,
      [0, 1],
      [baseScale, nextScale],
      Extrapolation.CLAMP
    );

    // TranslateY: stackIndex * 8 (base) -> decreases as swipe progresses
    const baseTranslateY = stackIndex * 10;
    const nextTranslateY = (stackIndex - 1) * 10;
    const translateY = interpolate(
      swipeProgress,
      [0, 1],
      [baseTranslateY, nextTranslateY],
      Extrapolation.CLAMP
    );

    // Opacity: fades in slightly as it moves forward
    const baseOpacity = 1 - stackIndex * 0.2;
    const nextOpacity = 1 - (stackIndex - 1) * 0.2;
    const opacity = interpolate(
      swipeProgress,
      [0, 1],
      [baseOpacity, nextOpacity],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
      zIndex: -stackIndex,
    };
  });

  return (
    <Animated.View style={[styles.stackCard, animatedStyle]}>
      <Image
        source={{ uri: photo.uri }}
        style={styles.image}
        contentFit="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stackCard: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
