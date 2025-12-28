import React from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { router } from 'expo-router';

interface EmptyStateProps {
  type: 'loading' | 'noPhotos' | 'allProcessed' | 'permissionDenied';
  onRequestPermission?: () => void;
}

export function EmptyState({ type, onRequestPermission }: EmptyStateProps) {
  const tintColor = useThemeColor({}, 'tint');

  if (type === 'loading') {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.text}>Loading photos...</ThemedText>
      </ThemedView>
    );
  }

  if (type === 'noPhotos') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>No Photos Found</ThemedText>
        <ThemedText style={styles.text}>
          There are no photos in your gallery.
        </ThemedText>
      </ThemedView>
    );
  }

  if (type === 'allProcessed') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>All Done!</ThemedText>
        <ThemedText style={styles.text}>
          You've reviewed all photos in your gallery. Great job!
        </ThemedText>
      </ThemedView>
    );
  }

  if (type === 'permissionDenied') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>Permission Required</ThemedText>
        <ThemedText style={styles.text}>
          Gallery Cleaner needs access to your photos to help you organize them.
        </ThemedText>
        {onRequestPermission && (
          <Pressable
            style={[styles.button, { backgroundColor: tintColor }]}
            onPress={onRequestPermission}
          >
            <ThemedText style={styles.buttonText}>Grant Access</ThemedText>
          </Pressable>
        )}
      </ThemedView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
