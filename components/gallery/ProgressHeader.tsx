import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { GalleryStats } from '@/types/gallery';

interface ProgressHeaderProps {
  stats: GalleryStats;
}

export function ProgressHeader({ stats }: ProgressHeaderProps) {
  const deleteColor = useThemeColor({}, 'deleteColor');
  const keepColor = useThemeColor({}, 'keepColor');
  const headerBg = useThemeColor({}, 'headerBackground');

  return (
    <ThemedView style={[styles.container, { backgroundColor: headerBg }]}>
      <View style={styles.progressRow}>
        <ThemedText style={styles.progressText}>
          Progress: {stats.processed}/{stats.totalPhotos} photos
        </ThemedText>
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
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
