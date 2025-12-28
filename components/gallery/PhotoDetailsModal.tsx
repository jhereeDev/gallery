import React from 'react';
import { Modal, StyleSheet, View, Pressable, ScrollView, Dimensions, Share } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import type { Photo, PhotoAnalysis } from '@/types/gallery';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhotoDetailsModalProps {
  visible: boolean;
  photo: Photo | null;
  analysis?: PhotoAnalysis;
  onClose: () => void;
}

export function PhotoDetailsModal({ visible, photo, analysis, onClose }: PhotoDetailsModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const surfaceColor = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');

  if (!photo) return null;

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    try {
      return format(new Date(timestamp), 'MMMM d, yyyy • h:mm a');
    } catch {
      return 'Unknown date';
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this photo from ${formatDate(photo.creationTime)}`,
        url: photo.uri,
      });
    } catch (error) {
      console.error('Error sharing photo:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.95)' }]}
      >
        {/* Close Button */}
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Full Screen Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: photo.uri }}
              style={styles.image}
              contentFit="contain"
              transition={300}
            />
          </View>

          {/* Details Card */}
          <View style={[styles.detailsCard, { backgroundColor: surfaceColor }]}>
            <View style={styles.header}>
              <ThemedText style={styles.sectionTitle}>Photo Details</ThemedText>
              <Pressable onPress={handleShare} style={styles.shareButton}>
                <Ionicons name="share-outline" size={20} color={tintColor} />
              </Pressable>
            </View>

            {/* Date */}
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={18} color={textSecondary} />
              <ThemedText style={styles.detailText}>{formatDate(photo.creationTime)}</ThemedText>
            </View>

            {/* Dimensions */}
            <View style={styles.detailRow}>
              <Ionicons name="resize-outline" size={18} color={textSecondary} />
              <ThemedText style={styles.detailText}>
                {photo.width} × {photo.height} pixels
              </ThemedText>
            </View>

            {/* File Size */}
            <View style={styles.detailRow}>
              <Ionicons name="document-outline" size={18} color={textSecondary} />
              <ThemedText style={styles.detailText}>{formatFileSize(photo.fileSize)}</ThemedText>
            </View>

            {/* Analysis Badges */}
            {analysis && (
              <View style={styles.badgesSection}>
                <ThemedText style={styles.badgeSectionTitle}>Analysis</ThemedText>
                <View style={styles.badgesContainer}>
                  {analysis.isScreenshot && (
                    <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                      <Ionicons name="phone-portrait" size={14} color="#f59e0b" />
                      <ThemedText style={[styles.badgeText, { color: '#f59e0b' }]}>
                        Screenshot
                      </ThemedText>
                    </View>
                  )}
                  {analysis.isBlurry && (
                    <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                      <Ionicons name="alert-circle" size={14} color="#ef4444" />
                      <ThemedText style={[styles.badgeText, { color: '#ef4444' }]}>
                        Blurry
                      </ThemedText>
                    </View>
                  )}
                  {analysis.ageInDays > 365 && (
                    <View style={[styles.badge, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                      <Ionicons name="time-outline" size={14} color="#3b82f6" />
                      <ThemedText style={[styles.badgeText, { color: '#3b82f6' }]}>
                        {Math.floor(analysis.ageInDays / 365)} years old
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 100,
    paddingBottom: 40,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.6,
  },
  detailsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  shareButton: {
    padding: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    flex: 1,
  },
  badgesSection: {
    marginTop: 8,
  },
  badgeSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

