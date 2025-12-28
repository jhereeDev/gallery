import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SPRING_CONFIG } from '@/utils/animations';
import type { GalleryStats } from '@/types/gallery';
import { Ionicons } from '@expo/vector-icons';
import { ExportStatsCard } from './ExportStatsCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProgressHeaderProps {
  stats: GalleryStats;
  onGalleryPress?: () => void;
}

export function ProgressHeader({ stats, onGalleryPress }: ProgressHeaderProps) {
  const deleteColor = useThemeColor({}, 'deleteColor');
  const keepColor = useThemeColor({}, 'keepColor');
  const tintColor = useThemeColor({}, 'tint');
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const [showStats, setShowStats] = useState(false);

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
    <View style={styles.container}>
      <View style={[styles.floatingCard, { backgroundColor: surfaceColor, shadowColor: '#000' }]}>
        <View style={styles.topRow}>
          <View style={styles.statGroup}>
            <Ionicons name="heart" size={16} color={keepColor} style={{ textAlign: 'center', textAlignVertical: 'center' }} />
            <ThemedText style={[styles.statNumber, { color: keepColor }]}>{stats.toKeep}</ThemedText>
          </View>

          <View style={styles.centerGroup}>
            <ThemedText style={styles.mainProgressText}>
              {stats.processed} <ThemedText style={styles.totalText}>/ {stats.totalPhotos}</ThemedText>
            </ThemedText>
          </View>

          <View style={styles.statGroup}>
            <ThemedText style={[styles.statNumber, { color: deleteColor }]}>{stats.toDelete}</ThemedText>
            <Ionicons name="trash" size={16} color={deleteColor} style={{ textAlign: 'center', textAlignVertical: 'center' }} />
          </View>

          <View style={styles.actionGroup}>
            {onGalleryPress && (
              <Pressable
                onPress={onGalleryPress}
                style={styles.actionButton}
              >
                <Ionicons name="grid" size={18} color={tintColor} style={{ textAlign: 'center', textAlignVertical: 'center' }} />
              </Pressable>
            )}

            <Pressable
              onPress={() => setShowStats(!showStats)}
              style={styles.actionButton}
            >
              <Ionicons name="stats-chart" size={18} color={tintColor} style={{ textAlign: 'center', textAlignVertical: 'center' }} />
            </Pressable>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { backgroundColor: tintColor }, progressBarStyle]} />
        </View>
      </View>

      {showStats && (
        <View style={styles.statsCardContainer}>
          <ExportStatsCard stats={stats} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    zIndex: 100,
  },
  floatingCard: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
  },
  statsCardContainer: {
    marginTop: 12,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 50,
  },
  centerGroup: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  mainProgressText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  totalText: {
    fontSize: 14,
    opacity: 0.4,
    fontWeight: '600',
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
});
