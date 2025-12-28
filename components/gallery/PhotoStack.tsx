import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import type { Photo } from '@/types/gallery';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.6;

interface PhotoStackProps {
  photos: Photo[];
  currentIndex: number;
}

export function PhotoStack({ photos, currentIndex }: PhotoStackProps) {
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
        const scale = 1 - stackIndex * 0.03; // Each card is 3% smaller
        const translateY = stackIndex * 8; // Each card is 8px lower

        return (
          <View
            key={photo.id}
            style={[
              styles.stackCard,
              {
                transform: [{ scale }, { translateY }],
                zIndex: -stackIndex,
              },
            ]}
          >
            <Image
              source={{ uri: photo.uri }}
              style={styles.image}
              contentFit="cover"
            />
          </View>
        );
      })}
    </>
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
