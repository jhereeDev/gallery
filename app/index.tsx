import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { useGallery } from '@/hooks/useGallery';
import { usePermissions } from '@/hooks/usePermissions';
import { SwipeCard } from '@/components/gallery/SwipeCard';
import { ProgressHeader } from '@/components/gallery/ProgressHeader';
import { ActionButtons } from '@/components/gallery/ActionButtons';
import { UndoButton } from '@/components/gallery/UndoButton';
import { PhotoStack } from '@/components/gallery/PhotoStack';
import { AchievementToast } from '@/components/gallery/AchievementToast';
import { FilterBar } from '@/components/gallery/FilterBar';
import { EmptyState } from '@/components/gallery/EmptyStates';
import { PRELOAD_THRESHOLD } from '@/constants/config';
import { storage } from '@/utils/storage';
import { applyFilter, getFilterCounts, type FilterType } from '@/utils/filters';
import type { Achievement } from '@/types/gallery';

export default function SwiperScreen() {
  const { state, dispatch, loadPhotos, loadMorePhotos, markPhoto, undoLastDecision, startSession, endSession, checkAndUpdateAchievements, analyzePhotos } = useGallery();
  const { status: permissionStatus, requestPermissions } = usePermissions();
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

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

  // Save current photo ID to storage whenever index changes
  useEffect(() => {
    const currentPhoto = state.photos[state.currentIndex];
    if (currentPhoto) {
      storage.saveLastPhotoId(currentPhoto.id);
    }
  }, [state.currentIndex, state.photos]);

  // Resume from last photo when photos are first loaded
  useEffect(() => {
    if (state.photos.length > 0 && state.lastResumePhotoId && state.currentIndex === 0 && state.decisions.size === 0) {
      const resumeIndex = state.photos.findIndex(p => p.id === state.lastResumePhotoId);
      if (resumeIndex >= 0) {
        // Resume from the next photo after the saved one
        const targetIndex = Math.min(resumeIndex + 1, state.photos.length - 1);
        dispatch({ type: 'SET_CURRENT_INDEX', index: targetIndex });
        console.log(`Auto-resumed to photo index ${targetIndex}`);
      }
    }
  }, [state.photos.length, state.lastResumePhotoId]);

  // Preload more photos when approaching the end
  useEffect(() => {
    const shouldLoadMore =
      state.currentIndex >= state.photos.length - PRELOAD_THRESHOLD &&
      state.hasMorePhotos &&
      !state.isLoading;

    if (shouldLoadMore) {
      loadMorePhotos();
    }
  }, [state.currentIndex, state.photos.length]);

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
    return applyFilter(state.photos, activeFilter, state.analyses, smartSuggestions);
  }, [state.photos, activeFilter, state.analyses, smartSuggestions]);

  const handleSwipeLeft = () => {
    const currentPhoto = state.photos[state.currentIndex];
    if (currentPhoto) {
      markPhoto(currentPhoto.id, 'keep');
      checkAchievements();
    }
  };

  const handleSwipeRight = () => {
    const currentPhoto = state.photos[state.currentIndex];
    if (currentPhoto) {
      markPhoto(currentPhoto.id, 'delete');
      checkAchievements();
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

  // All photos processed
  if (state.currentIndex >= state.photos.length) {
    return <EmptyState type="allProcessed" />;
  }

  const currentPhoto = state.photos[state.currentIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.content}>
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
          <PhotoStack photos={state.photos} currentIndex={state.currentIndex} />

          {/* Current Card */}
          {currentPhoto && (
            <SwipeCard
              photo={currentPhoto}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              isSuggested={smartSuggestions.includes(currentPhoto.id)}
            />
          )}
        </View>

        {/* Action Buttons */}
        <ActionButtons
          onKeep={handleSwipeLeft}
          onDelete={handleSwipeRight}
          disabled={!currentPhoto}
        />

        {/* Undo Button */}
        <UndoButton
          onPress={undoLastDecision}
          disabled={state.undoHistory.length === 0}
          count={state.undoHistory.length}
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
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    position: 'relative',
  },
});
