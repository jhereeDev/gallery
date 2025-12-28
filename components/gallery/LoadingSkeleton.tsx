import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/use-theme-color';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.92;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.65;

export function LoadingSkeleton() {
  const shimmer = useSharedValue(0);
  const backgroundColor = useThemeColor({}, 'cardBackground');
  const shimmerColor = useThemeColor({}, 'surface');

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-CARD_WIDTH, CARD_WIDTH]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.metadataPlaceholder}>
        <View style={[styles.line, styles.lineShort]} />
        <View style={[styles.line, styles.lineMedium]} />
      </View>
      <Animated.View
        style={[
          styles.shimmer,
          { backgroundColor: shimmerColor },
          shimmerStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  metadataPlaceholder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: 8,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  lineShort: {
    width: '40%',
  },
  lineMedium: {
    width: '60%',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: CARD_WIDTH,
    opacity: 0.3,
  },
});

