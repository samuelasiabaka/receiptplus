# Building APK for Testing

This guide will help you build an Android APK file for testing with your users.

## Prerequisites

1. **Expo Account**: Create a free account at [expo.dev](https://expo.dev)
2. **EAS CLI**: Install the Expo Application Services CLI

## Setup Steps

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
eas login
```

Enter your Expo account credentials.

### 3. Configure EAS Build (First Time Only)

```bash
eas build:configure
```

This will create the `eas.json` file (already created for you).

### 4. Build APK

**For Production (Default - Recommended):**
```bash
npm run build:android
```

Or directly:
```bash
eas build --platform android --profile production
```

**For Preview/Testing:**
```bash
npm run build:android:preview
```

Or directly:
```bash
eas build --platform android --profile preview
```

**Note:** Production builds use the `production` channel for EAS Updates, which is the default going forward.

## Build Process

1. EAS will upload your project to Expo's servers
2. Build will run in the cloud (takes 10-20 minutes)
3. You'll get a notification when build is complete
4. Download the APK from the Expo dashboard or via the link provided

## Downloading the APK

After the build completes:

1. Go to [expo.dev](https://expo.dev)
2. Navigate to your project
3. Click on "Builds" tab
4. Find your completed build
5. Click "Download" to get the APK file

## Sharing with Testers

### Option 1: Google Drive / Dropbox
1. Upload the APK to Google Drive or Dropbox
2. Share the link with testers
3. Testers download and install directly

### Option 2: Direct Email
1. Email the APK file directly to testers
2. Testers need to enable "Install from Unknown Sources" on Android

### Option 3: Firebase App Distribution (Recommended for Multiple Testers)
1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Login: `firebase login`
4. Initialize: `firebase init appdistribution`
5. Upload APK: `firebase appdistribution:distribute your-app.apk --app YOUR_APP_ID --groups "testers"`

## Tester Installation Instructions

Share these instructions with your testers:

### For Android Users:

1. **Download the APK** from the link you provided
2. **Enable Unknown Sources**:
   - Go to Settings → Security
   - Enable "Install from Unknown Sources" or "Install Unknown Apps"
   - Select your browser/file manager and allow it
3. **Install the APK**:
   - Open the downloaded APK file
   - Tap "Install"
   - Wait for installation to complete
4. **Open the app** from your app drawer

### Important Notes:

- **First-time setup**: Testers may need to allow installation from unknown sources
- **Security warning**: Android will show a security warning - this is normal for apps not from Play Store
- **Updates**: For new versions, testers need to uninstall the old version first, or install the new APK over it

## Troubleshooting

### Build Fails
- Check that all dependencies are properly installed
- Ensure `app.json` is valid
- Check Expo dashboard for detailed error logs

### APK Won't Install
- Ensure "Unknown Sources" is enabled
- Check Android version compatibility (minimum Android 6.0)
- Try uninstalling any previous version first

### Need Help?
- Check [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- Visit [Expo Forums](https://forums.expo.dev/)

## Build Profiles Explained

- **production**: Creates an AAB (Android App Bundle) ready for Play Store. Uses `production` channel for EAS Updates. **This is now the default.**
- **preview**: Creates an APK for testing. Uses `preview` channel for EAS Updates.

## Pushing Updates (No Rebuild Needed!)

After making code changes, you can push updates without rebuilding:

**For Production:**
```bash
npm run update
```

Or with a custom message:
```bash
npx eas update --branch production --message "Your update message"
```

**For Preview:**
```bash
npm run update:preview
```

**How Updates Work:**
- Updates are checked automatically when the app launches
- Users don't need to reinstall - updates apply automatically
- Only works with production/preview builds (not development builds)
- Updates are downloaded and applied in the background
- The app will reload to apply the update

**Important:** Make sure your build and update use the same channel:
- Production builds → `npm run update` (production channel)
- Preview builds → `npm run update:preview` (preview channel)

