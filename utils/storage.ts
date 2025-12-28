import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GalleryStats, SessionStats, Achievement } from '@/types/gallery';

const KEYS = {
  LAST_PHOTO_ID: '@gallery_cleaner:last_photo_id',
  STATS: '@gallery_cleaner:stats',
  ACHIEVEMENTS: '@gallery_cleaner:achievements',
  SESSIONS: '@gallery_cleaner:sessions',
  STREAK: '@gallery_cleaner:streak',
  LAST_SESSION_DATE: '@gallery_cleaner:last_session_date',
  FAVORITES: '@gallery_cleaner:favorites',
};

export const storage = {
  // Resume functionality
  async saveLastPhotoId(photoId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LAST_PHOTO_ID, photoId);
    } catch (error) {
      console.error('Failed to save last photo ID:', error);
    }
  },

  async getLastPhotoId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.LAST_PHOTO_ID);
    } catch (error) {
      console.error('Failed to get last photo ID:', error);
      return null;
    }
  },

  async clearLastPhotoId(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.LAST_PHOTO_ID);
    } catch (error) {
      console.error('Failed to clear last photo ID:', error);
    }
  },

  // Stats persistence
  async saveStats(stats: GalleryStats): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  },

  async getStats(): Promise<GalleryStats | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.STATS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  },

  // Achievements
  async saveAchievements(achievements: Achievement[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  },

  async getAchievements(): Promise<Achievement[] | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return null;
    }
  },

  // Sessions
  async saveSessions(sessions: SessionStats[]): Promise<void> {
    try {
      // Keep only last 30 sessions to prevent storage bloat
      const recentSessions = sessions.slice(-30);
      await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(recentSessions));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  },

  async getSessions(): Promise<SessionStats[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  },

  async addSession(session: SessionStats): Promise<void> {
    try {
      const sessions = await this.getSessions();
      sessions.push(session);
      await this.saveSessions(sessions);
    } catch (error) {
      console.error('Failed to add session:', error);
    }
  },

  // Streak management
  async updateStreak(): Promise<number> {
    try {
      const lastDate = await AsyncStorage.getItem(KEYS.LAST_SESSION_DATE);
      const currentStreak = await this.getCurrentStreak();
      const today = new Date().toDateString();

      if (!lastDate) {
        // First session ever
        await AsyncStorage.setItem(KEYS.LAST_SESSION_DATE, today);
        await AsyncStorage.setItem(KEYS.STREAK, '1');
        return 1;
      }

      const lastSessionDate = new Date(lastDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        // Same day, no change
        return currentStreak;
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        const newStreak = currentStreak + 1;
        await AsyncStorage.setItem(KEYS.STREAK, String(newStreak));
        await AsyncStorage.setItem(KEYS.LAST_SESSION_DATE, today);
        return newStreak;
      } else {
        // Streak broken, reset to 1
        await AsyncStorage.setItem(KEYS.STREAK, '1');
        await AsyncStorage.setItem(KEYS.LAST_SESSION_DATE, today);
        return 1;
      }
    } catch (error) {
      console.error('Failed to update streak:', error);
      return 0;
    }
  },

  async getCurrentStreak(): Promise<number> {
    try {
      const streak = await AsyncStorage.getItem(KEYS.STREAK);
      return streak ? parseInt(streak, 10) : 0;
    } catch (error) {
      console.error('Failed to get current streak:', error);
      return 0;
    }
  },

  // Favorites
  async saveFavorites(favoriteIds: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(favoriteIds));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  },

  async getFavorites(): Promise<string[] | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.FAVORITES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get favorites:', error);
      return null;
    }
  },

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  },
};
