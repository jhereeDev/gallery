import React from 'react';
import { StyleSheet, View } from 'react-native';
import { format } from 'date-fns';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Photo, PhotoAnalysis } from '@/types/gallery';
import { Ionicons } from '@expo/vector-icons';

interface MetadataPanelProps {
  photo: Photo;
  analysis?: PhotoAnalysis;
}

export function MetadataPanel({ photo, analysis }: MetadataPanelProps) {
  const accentColor = useThemeColor({}, 'accent');
  
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  // Determine if we should show badges
  const showBadges =
    analysis &&
    (analysis.isBlurry || analysis.isScreenshot || analysis.ageInDays > 365);

  return (
    <View style={styles.container}>
      {/* Top Gradient/Overlay effect would be nice, but using solid semi-transparent for now */}
      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={14} color="#fff" style={styles.icon} />
            <ThemedText style={styles.dateText}>
              {formatDate(photo.creationTime)}
            </ThemedText>
          </View>
          
          <View style={styles.row}>
            <Ionicons name="image-outline" size={14} color="#fff" style={styles.icon} />
            <ThemedText style={styles.detailsText}>
              {formatFileSize(photo.fileSize)} • {photo.width}×{photo.height}
            </ThemedText>
          </View>
        </View>

        {/* Analysis Badges */}
        {showBadges && (
          <View style={styles.badgesContainer}>
            {analysis.isScreenshot && (
              <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.9)' }]}>
                <Ionicons name="phone-portrait" size={12} color="#fff" />
                <ThemedText style={styles.badgeText}>SCREENSHOT</ThemedText>
              </View>
            )}

            {analysis.isBlurry && (
              <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.9)' }]}>
                <Ionicons name="alert-circle" size={12} color="#fff" />
                <ThemedText style={styles.badgeText}>
                  BLURRY
                </ThemedText>
              </View>
            )}

            {analysis.ageInDays > 365 && (
              <View style={[styles.badge, { backgroundColor: 'rgba(59, 130, 246, 0.9)' }]}>
                <Ionicons name="time" size={12} color="#fff" />
                <ThemedText style={styles.badgeText}>
                  {Math.floor(analysis.ageInDays / 365)}Y+ OLD
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40, // Fade space
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  mainInfo: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    opacity: 0.8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  detailsText: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.7,
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
