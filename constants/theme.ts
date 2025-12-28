/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#6366f1'; // Modern Indigo
const tintColorDark = '#818cf8';

export const Colors = {
  light: {
    text: '#0f172a', // Slate 900
    textSecondary: '#64748b', // Slate 500
    background: '#f8fafc', // Slate 50
    tint: tintColorLight,
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    deleteColor: '#ef4444', // Red 500
    keepColor: '#10b981', // Emerald 500
    overlayDark: 'rgba(15, 23, 42, 0.6)',
    cardBackground: '#ffffff',
    headerBackground: '#ffffff',
    accent: '#f59e0b', // Amber 500
    surface: '#ffffff',
    border: '#e2e8f0',
  },
  dark: {
    text: '#f8fafc', // Slate 50
    textSecondary: '#94a3b8', // Slate 400
    background: '#020617', // Slate 950
    tint: tintColorDark,
    icon: '#94a3b8',
    tabIconDefault: '#475569',
    tabIconSelected: tintColorDark,
    deleteColor: '#f87171', // Red 400
    keepColor: '#34d399', // Emerald 400
    overlayDark: 'rgba(0, 0, 0, 0.7)',
    cardBackground: '#0f172a', // Slate 900
    headerBackground: '#020617',
    accent: '#fbbf24', // Amber 400
    surface: '#1e293b', // Slate 800
    border: '#1e293b',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
