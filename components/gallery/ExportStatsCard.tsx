import React from 'react';
import { View, StyleSheet, Share, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import type { GalleryStats } from '@/types/gallery';

interface ExportStatsCardProps {
  stats: GalleryStats;
}

export function ExportStatsCard({ stats }: ExportStatsCardProps) {
  const surfaceColor = useThemeColor({}, 'surface');
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const formatStorage = (bytes: number): string => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleShare = async () => {
    const statsText = `📊 Gallery Cleaner Stats

✅ Photos Reviewed: ${stats.processed} / ${stats.totalPhotos}
🗑️ Photos Deleted: ${stats.toDelete}
💾 Storage Freed: ${formatStorage(stats.lifetimeFreed)}
⭐ Keep Rate: ${stats.totalPhotos > 0 ? ((stats.toKeep / stats.totalPhotos) * 100).toFixed(1) : 0}%

Keep cleaning! 🚀`;

    try {
      await Share.share({
        message: statsText,
        title: 'My Gallery Cleaner Stats',
      });
    } catch (error) {
      console.error('Error sharing stats:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: surfaceColor }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Your Progress</ThemedText>
        <Pressable onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={20} color={tintColor} />
        </Pressable>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statNumber, { color: tintColor }]}>
            {stats.processed}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Reviewed</ThemedText>
        </View>

        <View style={styles.statItem}>
          <ThemedText style={[styles.statNumber, { color: '#ef4444' }]}>
            {stats.toDelete}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Deleted</ThemedText>
        </View>

        <View style={styles.statItem}>
          <ThemedText style={[styles.statNumber, { color: '#10b981' }]}>
            {formatStorage(stats.lifetimeFreed)}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Freed</ThemedText>
        </View>
      </View>

      <Pressable style={[styles.shareButtonFull, { backgroundColor: tintColor }]} onPress={handleShare}>
        <Ionicons name="share-outline" size={18} color="#fff" />
        <ThemedText style={styles.shareButtonText}>Share Stats</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  shareButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: '600',
  },
  shareButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

