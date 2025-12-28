import React from 'react';
import { StyleSheet, View } from 'react-native';
import { format } from 'date-fns';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Photo, PhotoAnalysis } from '@/types/gallery';

interface MetadataPanelProps {
  photo: Photo;
  analysis?: PhotoAnalysis;
}

export function MetadataPanel({ photo, analysis }: MetadataPanelProps) {
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy • h:mm a');
    } catch {
      return 'Unknown date';
    }
  };

  const resolution = `${photo.width} × ${photo.height}`;

  // Determine if we should show badges
  const showBadges =
    analysis &&
    (analysis.isBlurry || analysis.isScreenshot || analysis.ageInDays > 365);

  return (
    <ThemedView style={styles.container}>
      {/* Metadata Section */}
      <View style={styles.metadataRow}>
        <ThemedText style={styles.metadataText}>
          {formatDate(photo.creationTime)}
        </ThemedText>
      </View>

      <View style={styles.metadataRow}>
        <ThemedText style={styles.metadataText}>
          {formatFileSize(photo.fileSize)} • {resolution}
        </ThemedText>
      </View>

      {/* Analysis Badges */}
      {showBadges && (
        <View style={styles.badgesContainer}>
          {analysis.isScreenshot && (
            <View style={[styles.badge, styles.screenshotBadge]}>
              <ThemedText style={styles.badgeText}>Screenshot</ThemedText>
            </View>
          )}

          {analysis.isBlurry && (
            <View style={[styles.badge, styles.blurryBadge]}>
              <ThemedText style={styles.badgeText}>
                Blurry ({analysis.blurScore.toFixed(0)}%)
              </ThemedText>
            </View>
          )}

          {analysis.ageInDays > 365 && (
            <View style={[styles.badge, styles.oldBadge]}>
              <ThemedText style={styles.badgeText}>
                {Math.floor(analysis.ageInDays / 365)}+ year
                {Math.floor(analysis.ageInDays / 365) > 1 ? 's' : ''} old
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  metadataRow: {
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  screenshotBadge: {
    backgroundColor: 'rgba(255, 159, 10, 0.9)',
  },
  blurryBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.9)',
  },
  oldBadge: {
    backgroundColor: 'rgba(100, 210, 255, 0.9)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
