# App Size Optimization Guide

## Optimizations Applied

### 1. **ProGuard/R8 Enabled** ✅
- Installed `expo-build-properties` plugin
- Configured `enableProguardInReleaseBuilds: true` via plugin
- **Impact**: Removes unused code, obfuscates code, reduces APK size by ~20-30%

### 2. **Resource Shrinking** ✅
- Configured `enableShrinkResourcesInReleaseBuilds: true` via plugin
- **Impact**: Removes unused resources (images, strings, etc.), saves ~5-10MB

### 3. **AAB (Android App Bundle) for Production** ✅
- Changed production build from APK to AAB
- **Impact**: Google Play generates optimized APKs per device, reducing download size by ~30-40%
- **Note**: For testing, preview builds still use APK

### 4. **Release Build Optimizations** ✅
- Preview builds now use `assembleRelease` (optimized)
- Production uses `bundleRelease` (AAB format)

## Expected Size Reduction

**Before**: ~90MB APK
**After**: 
- **APK (Preview)**: ~60-70MB (with ProGuard + resource shrinking)
- **AAB (Production)**: ~40-50MB download size (Google Play optimized)

## Additional Recommendations

### For Further Size Reduction:

1. **Optimize Images** (if needed):
   - Compress PNG assets using tools like TinyPNG
   - Use WebP format where possible
   - Remove unused image assets

2. **Remove Unused Dependencies** (if any):
   - Currently all dependencies are in use
   - Monitor bundle size as you add features

3. **Code Splitting** (Future):
   - Consider lazy loading for heavy screens
   - Split vendor bundles if app grows

4. **Asset Optimization**:
   - Current assets are minimal and necessary
   - Keep logo files optimized

## Build Commands

```bash
# Preview build (APK, optimized)
npm run build:android

# Production build (AAB, optimized)
npm run build:android:prod
```

## Notes

- **AAB files** cannot be installed directly on devices
- For testing, use the **preview** build (APK)
- For Play Store, use **production** build (AAB)
- Google Play will generate optimized APKs from AAB automatically

## Verification

After building, check the size:
- Preview APK: Should be ~60-70MB
- Production AAB: Base size ~40-50MB, but users download smaller optimized APKs

