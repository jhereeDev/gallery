import { useState, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Linking } from 'react-native';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'limited';

export function usePermissions() {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  // Check permission status on mount
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status: permStatus } = await MediaLibrary.getPermissionsAsync();

      if (permStatus === 'granted') {
        setStatus('granted');
      } else if (permStatus === 'denied') {
        setStatus('denied');
      } else {
        setStatus('undetermined');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setStatus('denied');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();

      if (permStatus === 'granted') {
        setStatus('granted');
        return true;
      } else {
        setStatus('denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setStatus('denied');
      return false;
    }
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return {
    status,
    isLoading,
    requestPermissions,
    checkPermissions,
    openSettings,
  };
}
