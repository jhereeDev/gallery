import React from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  type: 'loading' | 'noPhotos' | 'allProcessed' | 'permissionDenied' | 'noFilterResults';
  onRequestPermission?: () => void;
}

export function EmptyState({ type, onRequestPermission }: EmptyStateProps) {
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceColor = useThemeColor({}, 'surface');

  const getContent = () => {
    switch (type) {
      case 'loading':
        return {
          icon: <ActivityIndicator size="large" color={tintColor} />,
          title: 'Organizing Gallery...',
          text: 'This might take a moment depending on your gallery size.',
        };
      case 'noPhotos':
        return {
          icon: <Ionicons name="images-outline" size={80} color={textSecondary} />,
          title: 'Gallery Empty',
          text: 'We couldn\'t find any photos in your library. Try taking some beautiful photos first!',
        };
      case 'noFilterResults':
        return {
          icon: <Ionicons name="filter-outline" size={80} color={textSecondary} />,
          title: 'No Matches',
          text: 'None of your photos match this filter. Try another one or view all photos.',
        };
      case 'allProcessed':
        return {
          icon: <Ionicons name="checkmark-circle-outline" size={80} color={tintColor} />,
          title: 'All Done!',
          text: 'You\'ve successfully reviewed all your photos. Your gallery is now clean and organized!',
        };
      case 'permissionDenied':
        return {
          icon: <Ionicons name="lock-closed-outline" size={80} color={textSecondary} />,
          title: 'Access Required',
          text: 'Gallery Cleaner needs your permission to view and organize your photo library.',
          button: 'Grant Permission',
        };
      default:
        return null;
    }
  };

  const content = getContent();
  if (!content) return null;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {content.icon}
        </View>
        <ThemedText style={styles.title}>{content.title}</ThemedText>
        <ThemedText style={styles.text}>{content.text}</ThemedText>
        {type === 'permissionDenied' && onRequestPermission && (
          <Pressable
            style={[styles.button, { backgroundColor: tintColor }]}
            onPress={onRequestPermission}
          >
            <ThemedText style={styles.buttonText}>{content.button}</ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: 32,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -1,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.6,
    lineHeight: 24,
    fontWeight: '500',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
