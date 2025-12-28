import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/themed-view';
import { useGallery } from '@/hooks/useGallery';
import { usePermissions } from '@/hooks/usePermissions';
import { useThemeColor } from '@/hooks/use-theme-color';
import { SwipeCard } from '@/components/gallery/SwipeCard';
import { ProgressHeader } from '@/components/gallery/ProgressHeader';
import { ActionButtons } from '@/components/gallery/ActionButtons';
import { PhotoStack } from '@/components/gallery/PhotoStack';
import { AchievementToast } from '@/components/gallery/AchievementToast';
import { FilterBar } from '@/components/gallery/FilterBar';
import { EmptyState } from '@/components/gallery/EmptyStates';
import { PRELOAD_THRESHOLD } from '@/constants/config';
import { storage } from '@/utils/storage';
import { applyFilter, getFilterCounts, type FilterType } from '@/utils/filters';
import type { Achievement } from '@/types/gallery';

import Animated, { useSharedValue } from 'react-native-reanimated';
import { SPRING_CONFIG } from '@/utils/animations';

export default function SwiperScreen() {
  const { state, dispatch, loadPhotos, loadMorePhotos, markPhoto, undoLastDecision, startSession, endSession, checkAndUpdateAchievements, analyzePhotos } = useGallery();
  const { status: permissionStatus, requestPermissions } = usePermissions();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filteredIndex, setFilteredIndex] = useState(0);
  const background = useThemeColor({}, 'background');

  // Shared values for reactive UI
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Load photos on mount when permission is granted
  useEffect(() => {
    if (permissionStatus === 'granted' && state.photos.length === 0) {
      loadPhotos();
    }
  }, [permissionStatus]);

  // Start session when photos are loaded
  useEffect(() => {
    if (state.photos.length > 0 && !state.currentSession) {
      startSession();
    }
  }, [state.photos.length]);

  // Trigger photo analysis after photos are loaded
  useEffect(() => {
    if (state.photos.length > 0 && state.analyses.size === 0) {
      analyzePhotos();
    }
  }, [state.photos.length]);

  // Save current photo ID to storage whenever filtered index changes
  useEffect(() => {
    if (filteredPhotos && filteredPhotos[filteredIndex]) {
      const currentPhoto = filteredPhotos[filteredIndex];
      storage.saveLastPhotoId(currentPhoto.id);
    }
  }, [filteredIndex, filteredPhotos]);

  // Resume from last photo when photos are first loaded (only for 'all' filter)
  useEffect(() => {
    if (
      activeFilter === 'all' &&
      filteredPhotos &&
      filteredPhotos.length > 0 &&
      state.lastResumePhotoId &&
      filteredIndex === 0 &&
      state.decisions.size === 0
    ) {
      const resumeIndex = filteredPhotos.findIndex(p => p.id === state.lastResumePhotoId);
      if (resumeIndex >= 0) {
        // Resume from the next photo after the saved one
        const targetIndex = Math.min(resumeIndex + 1, filteredPhotos.length - 1);
        setFilteredIndex(targetIndex);
        console.log(`Auto-resumed to photo index ${targetIndex}`);
      }
    }
  }, [filteredPhotos, state.lastResumePhotoId, activeFilter, filteredIndex]);

  // Preload more photos when approaching the end (only for 'all' filter)
  useEffect(() => {
    if (activeFilter !== 'all') return;

    const shouldLoadMore =
      state.photos.length > 0 &&
      state.currentIndex >= state.photos.length - PRELOAD_THRESHOLD &&
      state.hasMorePhotos &&
      !state.isLoading;

    if (shouldLoadMore) {
      loadMorePhotos();
    }
  }, [filteredIndex, state.photos.length, activeFilter]);

  // Calculate smart suggestions (photos recommended for deletion)
  const smartSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    state.photos.forEach(photo => {
      const analysis = state.analyses.get(photo.id);
      if (!analysis) return;

      // Suggest if screenshot, blurry, or old
      if (analysis.isScreenshot || analysis.isBlurry || analysis.ageInDays > 730) {
        suggestions.push(photo.id);
      }
    });
    return suggestions;
  }, [state.photos, state.analyses]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    return getFilterCounts(state.photos, state.analyses, smartSuggestions);
  }, [state.photos, state.analyses, smartSuggestions]);

  // Apply active filter
  const filteredPhotos = useMemo(() => {
    if (!state.photos || state.photos.length === 0) {
      return [];
    }
    return applyFilter(state.photos, activeFilter, state.analyses, smartSuggestions);
  }, [state.photos, activeFilter, state.analyses, smartSuggestions]);

  // Reset filtered index when filter changes
  useEffect(() => {
    setFilteredIndex(0);
  }, [activeFilter]);

  // Reset filtered index when filtered photos change significantly
  useEffect(() => {
    if (!filteredPhotos || filteredPhotos.length === 0) {
      setFilteredIndex(0);
      return;
    }
    // Clamp index to valid range (only check, don't set if already valid to avoid loops)
    setFilteredIndex(prevIndex => {
      if (prevIndex >= filteredPhotos.length) {
        return Math.max(0, filteredPhotos.length - 1);
      }
      return prevIndex;
    });
  }, [filteredPhotos]);

  // Reset shared values when photo changes
  useEffect(() => {
    if (filteredPhotos && filteredPhotos[filteredIndex]) {
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [filteredPhotos, filteredIndex]);

  const handleSwipeLeft = () => {
    if (!filteredPhotos || filteredPhotos.length === 0) return;
    const currentPhoto = filteredPhotos[filteredIndex];
    if (currentPhoto) {
      markPhoto(currentPhoto.id, 'keep');
      checkAchievements();
      // Move to next photo in filtered array
      if (filteredIndex < filteredPhotos.length - 1) {
        setFilteredIndex(filteredIndex + 1);
      }
    }
  };

  const handleSwipeRight = () => {
    if (!filteredPhotos || filteredPhotos.length === 0) return;
    const currentPhoto = filteredPhotos[filteredIndex];
    if (currentPhoto) {
      markPhoto(currentPhoto.id, 'delete');
      checkAchievements();
      // Move to next photo in filtered array
      if (filteredIndex < filteredPhotos.length - 1) {
        setFilteredIndex(filteredIndex + 1);
      }
    }
  };

  const checkAchievements = () => {
    const newlyUnlocked = checkAndUpdateAchievements();
    if (newlyUnlocked.length > 0) {
      const achievementId = newlyUnlocked[0];
      const achievement = state.achievements.find(a => a.id === achievementId);
      if (achievement) {
        setCurrentAchievement(achievement);
      }
    }
  };

  const handleGrantPermission = async () => {
    const granted = await requestPermissions();
    if (granted) {
      loadPhotos();
    }
  };

  // Permission not granted
  if (permissionStatus === 'denied' || permissionStatus === 'undetermined') {
    return (
      <EmptyState type="permissionDenied" onRequestPermission={handleGrantPermission} />
    );
  }

  // Loading initial photos
  if (state.isLoading && state.photos.length === 0) {
    return <EmptyState type="loading" />;
  }

  // No photos found
  if (state.photos.length === 0 && !state.isLoading) {
    return <EmptyState type="noPhotos" />;
  }

  // No photos match the filter
  if (!filteredPhotos || (filteredPhotos.length === 0 && !state.isLoading && state.photos.length > 0)) {
    return <EmptyState type="noFilterResults" />;
  }

  if (filteredIndex >= filteredPhotos.length) {
    return <EmptyState type="allProcessed" />;
  }

  const currentPhoto = filteredPhotos[filteredIndex];

  if (!currentPhoto) {
    return <EmptyState type="loading" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.content}>
        {/* Background Blurred Image for Depth */}
        {currentPhoto && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Image
              source={{ uri: currentPhoto.uri }}
              style={styles.backgroundImage}
              contentFit="cover"
              blurRadius={50}
            />
            <View style={[styles.backgroundOverlay, { backgroundColor: background }]} />
          </View>
        )}

        {/* Achievement Toast */}
        {currentAchievement && (
          <AchievementToast
            achievement={currentAchievement}
            onDismiss={() => setCurrentAchievement(null)}
          />
        )}

        {/* Progress Header */}
        <ProgressHeader stats={state.stats} />

        {/* Filter Bar */}
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />

        {/* Swipe Card */}
        <View style={styles.cardContainer}>
          {/* Photo Stack (cards behind current) */}
          {filteredPhotos && (
            <PhotoStack 
              photos={filteredPhotos} 
              currentIndex={filteredIndex} 
              translateX={translateX}
            />
          )}

          {/* Current Card */}
          {currentPhoto && (
            <SwipeCard
              photo={currentPhoto}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              isSuggested={smartSuggestions.includes(currentPhoto.id)}
              translateX={translateX}
              translateY={translateY}
              analysis={state.analyses.get(currentPhoto.id)}
            />
          )}
        </View>

        {/* Action Buttons with integrated Undo */}
        <ActionButtons
          onKeep={handleSwipeLeft}
          onDelete={handleSwipeRight}
          onUndo={undoLastDecision}
          canUndo={state.undoHistory.length > 0}
          disabled={!currentPhoto}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
});
