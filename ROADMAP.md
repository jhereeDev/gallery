# Gallery Cleaner - Development Roadmap

## Current Status

### ✅ Completed Phases

**Phase 1: Foundation**
- ✅ Auto-resume from last photo on app restart
- ✅ Quick undo button (last 5 decisions, blue button, left side)
- ✅ Photo metadata display component (MetadataPanel)
- ✅ Session tracking with AsyncStorage persistence
- ✅ Streak tracking (daily login streak)
- ✅ Stats persistence (lifetime deleted, storage freed)

**Phase 2: Interactive**
- ✅ Photo stack preview (2 cards behind current card)
- ✅ 11 Achievement system:
  - First Steps, Getting Started, Century Club
  - Declutter Begins, Space Saver, Storage Master
  - 3/7/30-day streaks
  - Speed Demon, Completionist
- ✅ Achievement toast notifications with animations
- ✅ Achievement persistence and progress tracking

**Phase 3: Intelligence (Components Created)**
- ✅ Photo analysis utilities (utils/photoAnalysis.ts)
  - Screenshot detection (filename + aspect ratio)
  - Blur detection (simplified, age-based)
  - Duplicate detection (file size + timestamp)
  - Old photo detection (2+ years)
- ✅ Filter utilities (utils/filters.ts)
  - 7 filter types: All, Suggestions, Screenshots, Blurry, Old, Duplicates, Large
- ✅ FilterBar component (horizontal scrollable chips)
- ⚠️ **Not yet integrated into main app**

### 🚧 Core Functionality

**Working:**
- ✅ Swipe gestures (left = keep, right = delete)
- ✅ Auto-deletion after 5 decisions (sliding window)
- ✅ Undo last 5 decisions
- ✅ Photo loading with pagination (20 photos at a time)
- ✅ Permission handling (iOS/Android)
- ✅ Haptic feedback (iOS only)
- ✅ Photo stack visual effect
- ✅ Animated overlays (DELETE/KEEP)
- ✅ Achievement unlocks with toast notifications

**Issues:**
- ⚠️ File size not available from expo-media-library Asset type
  - Currently using `fileSize: undefined` for all photos
  - Affects: Storage calculations, large file detection
  - **Fix needed:** Implement file size fetching using expo-file-system

---

## 📋 Phase 4: Analytics & Insights (Not Started)

### Goals
Provide users with detailed insights about their photo cleaning habits and progress.

### Features to Implement

#### 1. **Insights Dashboard Screen**
**File:** `app/insights.tsx`
```typescript
// New route: /insights
// Accessible from main screen via button
```

**Components needed:**
- `components/insights/InsightsScreen.tsx` - Main dashboard
- `components/insights/StatCard.tsx` - Individual stat display cards
- `components/insights/ChartView.tsx` - Charts/graphs wrapper

**Dependencies:**
```bash
npm install react-native-chart-kit
npm install react-native-svg  # Already installed
```

**Stats to display:**
- Total photos reviewed (all-time)
- Total photos deleted (all-time)
- Storage freed (formatted: GB/MB)
- Current streak vs. best streak
- Average session length
- Most productive day of week
- Photos reviewed per day (last 30 days)
- Deletion rate (% of photos deleted)

#### 2. **Charts & Visualizations**
- **Line chart:** Photos deleted over time (last 30 days)
- **Bar chart:** Photos reviewed per day of week
- **Pie chart:** Keep vs Delete ratio
- **Progress bars:** Achievement progress

#### 3. **Session History**
- List of last 10 sessions
- Session details: date, duration, photos reviewed, deleted, kept
- Storage freed per session

#### 4. **Comparison View for Duplicates**
**File:** `components/gallery/ComparisonView.tsx`
- Side-by-side view of duplicate photos
- Allow quick selection (keep left/right/delete both)
- Highlight differences
- Show metadata comparison

#### 5. **Export Functionality**
- Export session history as CSV
- Export stats summary as text/JSON
- Share achievements on social media (optional)

---

## 🔧 Phase 3 Integration Tasks

### Tasks to Complete Phase 3

#### 1. **Integrate Photo Analysis**
**File:** `contexts/GalleryContext.tsx`

Add background analysis worker:
```typescript
// After photos load, analyze them in batches
useEffect(() => {
  if (state.photos.length > 0 && state.analyses.size === 0) {
    analyzePhotosInBackground();
  }
}, [state.photos]);

const analyzePhotosInBackground = async () => {
  const analyses = await analyzePhotoBatch(
    state.photos,
    state.photos,
    (analyzed, total) => {
      // Update progress if needed
    }
  );

  analyses.forEach((analysis, photoId) => {
    dispatch({
      type: 'SET_PHOTO_ANALYSIS',
      photoId,
      analysis
    });
  });
};
```

#### 2. **Add FilterBar to Main Screen**
**File:** `app/index.tsx`

```typescript
import { FilterBar } from '@/components/gallery/FilterBar';
import { applyFilter, getFilterCounts, type FilterType } from '@/utils/filters';

// Add state
const [activeFilter, setActiveFilter] = useState<FilterType>('all');
const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);

// Calculate filter counts
const filterCounts = useMemo(() =>
  getFilterCounts(state.photos, state.analyses, smartSuggestions),
  [state.photos, state.analyses, smartSuggestions]
);

// Filter photos
const filteredPhotos = useMemo(() =>
  applyFilter(state.photos, activeFilter, state.analyses, smartSuggestions),
  [state.photos, activeFilter, state.analyses, smartSuggestions]
);

// Render
<FilterBar
  activeFilter={activeFilter}
  onFilterChange={setActiveFilter}
  counts={filterCounts}
/>
```

#### 3. **Show Smart Suggestion Badges**
**File:** `components/gallery/SwipeCard.tsx`

Add badge when photo has smart suggestion:
```typescript
{smartSuggestions.includes(photo.id) && (
  <View style={styles.suggestionBadge}>
    <ThemedText style={styles.suggestionText}>✨ Suggested</ThemedText>
  </View>
)}
```

#### 4. **Fix File Size Detection**
**File:** `contexts/GalleryContext.tsx`

Use expo-file-system to get actual file sizes:
```typescript
import * as FileSystem from 'expo-file-system';

const getFileSize = async (uri: string): Promise<number> => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? (info.size || 0) : 0;
  } catch {
    return 0;
  }
};

// In LOAD_PHOTOS_SUCCESS:
const photosWithSize = await Promise.all(
  assets.map(async (asset) => ({
    id: asset.id,
    uri: asset.uri,
    filename: asset.filename,
    width: asset.width,
    height: asset.height,
    creationTime: asset.creationTime,
    fileSize: await getFileSize(asset.uri),
    mediaType: asset.mediaType === 'video' ? 'video' : 'photo',
    duration: asset.duration || undefined,
  }))
);
```

---

## 🎨 UI/UX Improvements

### High Priority

1. **Loading States**
   - Show skeleton loading for photos
   - Progress indicator during background analysis
   - Smooth transitions between photos

2. **Empty States**
   - Better messaging when filters return no results
   - Illustrations for empty states
   - Call-to-action buttons

3. **Animations**
   - Smooth card exit animations
   - Spring physics for undo
   - Particle effects for achievements

4. **Dark Mode Support**
   - Update theme colors for dark mode
   - Test all components in dark mode
   - Respect system theme preference

5. **Accessibility**
   - Screen reader support
   - Larger touch targets
   - High contrast mode
   - Voice commands (optional)

### Medium Priority

6. **Onboarding Flow**
   - Tutorial on first launch
   - Swipe gesture tutorial
   - Feature highlights
   - Permission explanation

7. **Settings Screen**
   - Customize swipe direction (swap left/right)
   - Auto-delete threshold (default: 5)
   - Haptic feedback toggle
   - Reset statistics option
   - Clear cache

8. **Photo Details Modal**
   - Full-screen photo view
   - Detailed metadata (EXIF data)
   - Location on map (if available)
   - Edit photo option

9. **Batch Actions**
   - Select multiple photos
   - Bulk delete
   - Bulk keep
   - Smart select (all screenshots, all blurry, etc.)

10. **Search Functionality**
    - Search by filename
    - Search by date range
    - Search by location
    - Search by size

---

## 🚀 Advanced Features

### Feature Ideas

1. **AI-Powered Analysis** (Advanced)
   - Use on-device ML for blur detection (TensorFlow Lite)
   - Face detection for group photos
   - Scene classification
   - Quality scoring

2. **Cloud Backup Integration**
   - Backup before deletion (Google Drive, iCloud)
   - Sync stats across devices
   - Restore deleted photos (trash folder)

3. **Social Features**
   - Compare stats with friends
   - Leaderboards
   - Share achievements
   - Weekly challenges

4. **Advanced Duplicates**
   - Perceptual hashing (visual similarity)
   - Group similar photos
   - Keep best quality automatically
   - Burst photo detection

5. **Photo Organization**
   - Create albums from keep decisions
   - Auto-categorize (people, places, things)
   - Smart collections
   - Favorites system

6. **Scheduled Cleaning**
   - Weekly reminder notifications
   - "Clean 10 photos daily" routine
   - Background cleaning suggestions

7. **Storage Insights**
   - Show storage by category (screenshots, videos, etc.)
   - Predict when storage will fill up
   - Suggest optimal cleaning frequency

8. **Photo Enhancement**
   - Auto-enhance before keeping
   - Crop suggestions
   - Filter application
   - Red-eye removal

9. **Video Support**
   - Support video deletion
   - Video preview in cards
   - Trim videos
   - Extract frames

10. **Widgets**
    - Home screen widget showing stats
    - Quick action widget (clean now)
    - Streak counter widget

---

## 🐛 Known Issues & Bug Fixes

### Critical
- [ ] File size always undefined (need FileSystem implementation)
- [ ] Current index adjustment after auto-deletion (may skip photos)
- [ ] Achievement check causes re-render on every swipe

### High Priority
- [ ] Memory management for large photo libraries (1000+ photos)
- [ ] Handle permission revocation mid-session
- [ ] Network image loading timeout
- [ ] Android back button behavior

### Medium Priority
- [ ] Haptic feedback only works on iOS
- [ ] Photo stack flickers on rapid swipes
- [ ] Achievement toast overlaps with header on small screens
- [ ] Filter counts not updating in real-time

### Low Priority
- [ ] Undo button animation stutters on older devices
- [ ] Progress header numbers don't animate
- [ ] Long filenames overflow in SwipeCard

---

## 🔒 Security & Privacy

### To Implement
- [ ] Secure storage for sensitive stats
- [ ] Privacy policy screen
- [ ] Terms of service
- [ ] Data export (GDPR compliance)
- [ ] Option to disable analytics
- [ ] Local-only mode (no cloud features)

---

## 📱 Platform-Specific

### iOS Enhancements
- [ ] Live Photos support
- [ ] iCloud Photos integration
- [ ] Siri Shortcuts
- [ ] 3D Touch quick actions
- [ ] Share sheet integration

### Android Enhancements
- [ ] Work profile support
- [ ] Samsung Gallery integration
- [ ] Quick Settings tile
- [ ] App shortcuts
- [ ] Picture-in-picture mode

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Photo analysis algorithms
- [ ] Filter logic
- [ ] Achievement checking
- [ ] Storage utilities

### Integration Tests
- [ ] Photo loading and pagination
- [ ] Auto-deletion flow
- [ ] Undo functionality
- [ ] Session persistence

### E2E Tests
- [ ] Complete user flow (load → swipe → delete → undo)
- [ ] Permission handling
- [ ] Achievement unlocks
- [ ] Filter switching

---

## 📊 Performance Optimizations

### Current Issues
- Photo analysis blocks UI thread
- Achievement checking on every swipe is expensive
- Large photo libraries cause memory issues

### Optimizations Needed
1. **Use Web Workers for Analysis**
   - Move photo analysis to background thread
   - Batch processing with lower priority

2. **Memoization**
   - Memoize filter counts
   - Memoize achievement checks
   - Cache analyzed photos

3. **Virtualization**
   - Only render visible cards
   - Lazy load photos outside viewport
   - Unload off-screen images

4. **Image Optimization**
   - Use thumbnails for stack preview
   - Lazy load full-resolution images
   - Progressive image loading

5. **State Management**
   - Consider Zustand/Redux for large datasets
   - Normalize state shape
   - Selective re-renders

---

## 📦 Distribution

### App Store Preparation
- [ ] App icon design
- [ ] Screenshots (6.5", 5.5", iPad)
- [ ] App Store description
- [ ] Privacy policy
- [ ] Support URL
- [ ] Marketing materials

### Play Store Preparation
- [ ] Feature graphic
- [ ] Screenshots (phone, tablet)
- [ ] Play Store description
- [ ] Privacy policy
- [ ] Content rating

---

## 🎯 Metrics & Analytics

### Track These Metrics
- Daily active users (DAU)
- Average session length
- Photos reviewed per session
- Deletion rate
- Feature usage (filters, undo, etc.)
- Achievement unlock rate
- Retention (D1, D7, D30)
- Crash rate
- Performance metrics (app start time, swipe responsiveness)

### Tools to Consider
- Firebase Analytics
- Sentry for error tracking
- Performance monitoring

---

## 🗓️ Suggested Timeline

### Immediate (Next Sprint)
1. Fix file size detection
2. Integrate Phase 3 filters
3. Fix critical bugs
4. Add MetadataPanel to SwipeCard

### Short-term (1-2 weeks)
1. Complete Phase 4 (Analytics)
2. Implement settings screen
3. Add onboarding flow
4. Dark mode support

### Medium-term (1 month)
1. Advanced duplicate detection
2. AI-powered analysis
3. Cloud backup integration
4. Widget support

### Long-term (2-3 months)
1. Social features
2. Video support
3. Photo enhancement
4. Platform-specific features

---

## 📝 Notes

### Architecture Decisions
- **State Management:** Currently using Context API + useReducer
  - Works well for current scale
  - May need Redux/Zustand for Phase 4+

- **Photo Loading:** Batch loading (20 at a time)
  - Prevents memory issues
  - Could implement infinite scroll for better UX

- **Auto-Deletion:** Sliding window (last 5)
  - Good balance between undo capability and automation
  - User requested this specific behavior

### Code Quality
- All TypeScript, no any types (except placeholder implementations)
- Consistent naming conventions
- Reanimated for all animations
- Expo for cross-platform compatibility

### Future Considerations
- Consider Expo EAS Build for distribution
- Implement OTA updates for minor fixes
- Set up CI/CD pipeline
- Code documentation (JSDoc)
- Component library (Storybook)

---

**Last Updated:** December 2024
**Status:** Phase 1-2 Complete, Phase 3 Components Created, Phase 4 Planned
