import type { Achievement, GalleryStats, SessionStats } from '@/types/gallery';

// Achievement definitions
export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Review your first photo',
    icon: '👶',
    progress: 0,
    target: 1,
  },
  {
    id: 'getting_started',
    title: 'Getting Started',
    description: 'Review 10 photos',
    icon: '🚀',
    progress: 0,
    target: 10,
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Review 100 photos',
    icon: '💯',
    progress: 0,
    target: 100,
  },
  {
    id: 'declutter_begins',
    title: 'Declutter Begins',
    description: 'Delete your first photo',
    icon: '🗑️',
    progress: 0,
    target: 1,
  },
  {
    id: 'space_saver',
    title: 'Space Saver',
    description: 'Free up 100MB of storage',
    icon: '💾',
    progress: 0,
    target: 100 * 1024 * 1024, // 100MB in bytes
  },
  {
    id: 'storage_master',
    title: 'Storage Master',
    description: 'Free up 1GB of storage',
    icon: '🏆',
    progress: 0,
    target: 1024 * 1024 * 1024, // 1GB in bytes
  },
  {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Clean photos 3 days in a row',
    icon: '🔥',
    progress: 0,
    target: 3,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Clean photos 7 days in a row',
    icon: '⚡',
    progress: 0,
    target: 7,
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Clean photos 30 days in a row',
    icon: '🌟',
    progress: 0,
    target: 30,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Review 50 photos in one session',
    icon: '⚡',
    progress: 0,
    target: 50,
  },
  {
    id: 'completionist',
    title: 'Completionist',
    description: 'Delete 500 photos total',
    icon: '✨',
    progress: 0,
    target: 500,
  },
];

// Check which achievements should be unlocked
export function checkAchievements(
  achievements: Achievement[],
  stats: GalleryStats,
  currentSession: SessionStats | null
): { achievements: Achievement[]; newlyUnlocked: string[] } {
  const newlyUnlocked: string[] = [];

  const updatedAchievements = achievements.map((achievement) => {
    // Skip if already unlocked
    if (achievement.unlockedAt) {
      return achievement;
    }

    let progress = achievement.progress;
    let shouldUnlock = false;

    switch (achievement.id) {
      case 'first_steps':
        progress = stats.processed;
        shouldUnlock = stats.processed >= 1;
        break;

      case 'getting_started':
        progress = stats.processed;
        shouldUnlock = stats.processed >= 10;
        break;

      case 'century_club':
        progress = stats.lifetimeDeleted + stats.processed;
        shouldUnlock = progress >= 100;
        break;

      case 'declutter_begins':
        progress = stats.toDelete + stats.lifetimeDeleted;
        shouldUnlock = progress >= 1;
        break;

      case 'space_saver':
        progress = stats.lifetimeFreed;
        shouldUnlock = stats.lifetimeFreed >= 100 * 1024 * 1024;
        break;

      case 'storage_master':
        progress = stats.lifetimeFreed;
        shouldUnlock = stats.lifetimeFreed >= 1024 * 1024 * 1024;
        break;

      case 'streak_3':
        progress = stats.currentStreak;
        shouldUnlock = stats.currentStreak >= 3;
        break;

      case 'streak_7':
        progress = stats.currentStreak;
        shouldUnlock = stats.currentStreak >= 7;
        break;

      case 'streak_30':
        progress = stats.currentStreak;
        shouldUnlock = stats.currentStreak >= 30;
        break;

      case 'speed_demon':
        progress = currentSession?.photosReviewed || 0;
        shouldUnlock = (currentSession?.photosReviewed || 0) >= 50;
        break;

      case 'completionist':
        progress = stats.lifetimeDeleted;
        shouldUnlock = stats.lifetimeDeleted >= 500;
        break;
    }

    const updated = { ...achievement, progress };

    if (shouldUnlock && !achievement.unlockedAt) {
      newlyUnlocked.push(achievement.id);
      return {
        ...updated,
        unlockedAt: Date.now(),
      };
    }

    return updated;
  });

  return {
    achievements: updatedAchievements,
    newlyUnlocked,
  };
}

// Initialize achievements with definitions
export function initializeAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map(def => ({ ...def }));
}

// Format progress for display
export function formatProgress(achievement: Achievement): string {
  if (achievement.id === 'space_saver' || achievement.id === 'storage_master') {
    const progressMB = achievement.progress / (1024 * 1024);
    const targetMB = achievement.target / (1024 * 1024);
    if (targetMB >= 1024) {
      return `${(progressMB / 1024).toFixed(2)}GB / ${(targetMB / 1024).toFixed(0)}GB`;
    }
    return `${progressMB.toFixed(0)}MB / ${targetMB.toFixed(0)}MB`;
  }

  return `${achievement.progress} / ${achievement.target}`;
}

// Get progress percentage
export function getProgressPercentage(achievement: Achievement): number {
  return Math.min(100, (achievement.progress / achievement.target) * 100);
}
