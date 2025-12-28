import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SPRING_CONFIG } from '@/utils/animations';
import type { GalleryStats } from '@/types/gallery';

interface ProgressHeaderProps {
  stats: GalleryStats;
}

export function ProgressHeader({ stats }: ProgressHeaderProps) {
  const deleteColor = useThemeColor({}, 'deleteColor');
  const keepColor = useThemeColor({}, 'keepColor');
  const headerBg = useThemeColor({}, 'headerBackground');
  const tintColor = useThemeColor({}, 'tint');

  const progress = useSharedValue(0);

  useEffect(() => {
    if (stats.totalPhotos > 0) {
      progress.value = withSpring(stats.processed / stats.totalPhotos, SPRING_CONFIG);
    }
  }, [stats.processed, stats.totalPhotos]);

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: headerBg }]}>
      <View style={styles.progressRow}>
        <ThemedText style={styles.progressText}>
          {stats.processed} / {stats.totalPhotos} photos reviewed
        </ThemedText>
        
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { backgroundColor: tintColor }, progressBarStyle]} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statNumber, { color: deleteColor }]}>
            {stats.toDelete}
          </ThemedText>
          <ThemedText style={styles.statLabel}>To Delete</ThemedText>
        </View>

        <View style={styles.separator} />

        <View style={styles.statItem}>
          <ThemedText style={[styles.statNumber, { color: keepColor }]}>
            {stats.toKeep}
          </ThemedText>
          <ThemedText style={styles.statLabel}>To Keep</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  progressRow: {
    marginBottom: 16,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  progressBarContainer: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
