import React from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

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
          icon: (
            <View style={[styles.iconCircle, { backgroundColor: `${tintColor}20` }]}>
              <ActivityIndicator size="large" color={tintColor} />
            </View>
          ),
          iconColor: tintColor,
          title: 'Organizing Gallery...',
          text: 'This might take a moment depending on your gallery size.',
        };
      case 'noPhotos':
        return {
          icon: (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
              <Ionicons name="images-outline" size={72} color={textSecondary} style={{ textAlign: 'center', textAlignVertical: 'center' }} />
            </View>
          ),
          iconColor: textSecondary,
          title: 'Gallery Empty',
          text: 'We couldn\'t find any photos in your library. Try taking some beautiful photos first!',
        };
      case 'noFilterResults':
        return {
          icon: (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
              <Ionicons name="filter-outline" size={72} color="#fbbf24" style={{ textAlign: 'center', textAlignVertical: 'center' }} />
            </View>
          ),
          iconColor: '#fbbf24',
          title: 'No Matches',
          text: 'None of your photos match this filter. Try another one or view all photos.',
        };
      case 'allProcessed':
        return {
          icon: (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="checkmark-circle" size={72} color="#10b981" style={{ textAlign: 'center', textAlignVertical: 'center' }} />
            </View>
          ),
          iconColor: '#10b981',
          title: 'All Done!',
          text: 'You\'ve successfully reviewed all your photos. Your gallery is now clean and organized!',
        };
      case 'permissionDenied':
        return {
          icon: (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="lock-closed" size={72} color="#ef4444" style={{ textAlign: 'center', textAlignVertical: 'center' }} />
            </View>
          ),
          iconColor: '#ef4444',
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
      <Animated.View entering={FadeIn.duration(500)} style={styles.content}>
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.iconContainer}>
          {content.icon}
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <ThemedText style={styles.title}>{content.title}</ThemedText>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <ThemedText style={styles.text}>{content.text}</ThemedText>
        </Animated.View>
        {type === 'permissionDenied' && onRequestPermission && (
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Pressable
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={onRequestPermission}
            >
              <ThemedText style={styles.buttonText}>{content.button}</ThemedText>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
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
    marginBottom: 40,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: -1,
  },
  text: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 36,
    opacity: 0.65,
    lineHeight: 26,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  button: {
    paddingHorizontal: 36,
    paddingVertical: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
