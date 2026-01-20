# Loretta Mobile App Setup Guide

This guide explains how to run the Loretta app on your iOS and Android devices for testing.

## Prerequisites

### For iOS Development (Mac only)
1. **Xcode** - Download free from the Mac App Store
2. **Command Line Tools** - Run `xcode-select --install` in Terminal
3. **CocoaPods** - Run `sudo gem install cocoapods` in Terminal

### For Android Development (Mac, Windows, or Linux)
1. **Android Studio** - Download free from https://developer.android.com/studio
2. **Java JDK** - Usually installed with Android Studio

## Quick Start

### Step 1: Download the Project

Download your Replit project as a ZIP file:
1. In Replit, click the three dots menu (⋯) near the file list
2. Select "Download as zip"
3. Extract the ZIP file on your computer

### Step 2: Install Dependencies

Open Terminal/Command Prompt, navigate to the project folder, and run:

```bash
npm install
```

### Step 3: Build the Web App

```bash
npm run build
```

### Step 4: Sync with Native Platforms

```bash
npx cap sync
```

---

## Running on iOS (Mac only)

### Option A: iOS Simulator (Easiest)

```bash
npx cap open ios
```

This opens Xcode. Then:
1. Select a simulator from the device dropdown (e.g., "iPhone 15")
2. Click the Play button (▶) to build and run

### Option B: Your iPhone

1. Connect your iPhone via USB cable
2. Open Xcode with `npx cap open ios`
3. Select your iPhone from the device dropdown
4. You'll need to configure code signing:
   - Go to the "Signing & Capabilities" tab
   - Select your Apple ID under "Team" (create one if needed)
   - Change the Bundle Identifier if there's a conflict (e.g., `com.yourname.loretta`)
5. On your iPhone: Go to Settings > General > Device Management, and trust the developer
6. Click Play (▶) to install and run

**Note:** With a free Apple ID, the app expires after 7 days. Just rebuild and reinstall when needed.

---

## Running on Android

### Option A: Android Emulator (Easiest)

```bash
npx cap open android
```

This opens Android Studio. Then:
1. Wait for Gradle to sync (may take a few minutes the first time)
2. Click the green Play button (▶)
3. If no emulator exists, create one:
   - Go to Tools > Device Manager
   - Click "Create Device"
   - Choose a phone (e.g., Pixel 7)
   - Download and select a system image
   - Finish and run

### Option B: Your Android Phone

1. On your phone, enable Developer Options:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings > Developer Options
   - Enable "USB Debugging"
2. Connect your phone via USB cable
3. Open Android Studio with `npx cap open android`
4. Your phone should appear in the device dropdown
5. Click Play (▶) to install and run
6. On your phone, accept any permission prompts

---

## Updating After Code Changes

When you make changes to the web app:

```bash
npm run build
npx cap sync
```

Then re-run in Xcode or Android Studio.

---

## Common Issues

### iOS: "Signing certificate error"
- Make sure you've selected a Team in Signing & Capabilities
- Try changing the Bundle Identifier to something unique

### iOS: "App won't launch on device"
- Trust the developer certificate on your iPhone (Settings > General > Device Management)

### Android: "Gradle sync failed"
- Wait for Android Studio to finish indexing
- Try File > Sync Project with Gradle Files

### Android: "Device not found"
- Make sure USB Debugging is enabled
- Try a different USB cable
- Run `adb devices` to check connection

---

## Project Structure

```
ios/                    # iOS native project (open with Xcode)
android/                # Android native project (open with Android Studio)
capacitor.config.ts     # Capacitor configuration
client/                 # React web app source
dist/public/            # Built web app (synced to native apps)
```

---

## Backend Configuration

The mobile app connects to your deployed Replit backend at `https://loretta-care.replit.app`. 

**Important:** Before distributing the app, make sure your Replit app is deployed (published) so it's always accessible. The mobile app cannot connect to development URLs that change.

To update the backend URL:
1. Open `client/src/lib/queryClient.ts`
2. Find the `API_BASE_URL` constant
3. Update the URL to your deployed Replit app URL

```typescript
const API_BASE_URL = Capacitor.isNativePlatform()
  ? "https://your-app-name.replit.app"  // <-- Change this
  : "";
```

---

## TestFlight Deployment (iOS Beta Testing)

### Prerequisites
1. **Apple Developer Account** - $99/year at [developer.apple.com](https://developer.apple.com)
2. **Xcode** - Latest version from Mac App Store
3. **CocoaPods** - Run `sudo gem install cocoapods` in Terminal

### Step 1: Prepare the Build

```bash
# On your Mac, download the project from Replit (Download as ZIP)
# Extract and open Terminal in that folder

npm install
npm run build
npx cap sync ios
cd ios/App && pod install && cd ../..
```

### Step 2: Open in Xcode

```bash
npx cap open ios
```

### Step 3: Configure Signing

1. Click on **App** in the left sidebar (blue icon)
2. Select the **Signing & Capabilities** tab
3. Check **"Automatically manage signing"**
4. Under **Team**, select your Apple Developer account
5. **Bundle Identifier**: `com.lorettahealth.healthnavigator`

### Step 4: Set Version Numbers

In the **General** tab:
- **Version**: `1.0.0` (user-facing)
- **Build**: `1` (increment each upload: 1 → 2 → 3)

### Step 5: Create App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Loretta Health
   - **Primary Language**: English
   - **Bundle ID**: Select the one from Xcode
   - **SKU**: `loretta-health-001`
4. Click **Create**

### Step 6: Archive the App

1. In Xcode, select **Any iOS Device (arm64)** from the device dropdown
2. Go to **Product** → **Archive**
3. Wait for build (5-10 minutes)
4. **Organizer** window opens automatically

### Step 7: Upload to App Store Connect

1. In Organizer, select your archive
2. Click **Distribute App**
3. Select **App Store Connect** → **Next**
4. Select **Upload** → **Next**
5. Keep defaults → **Next**
6. Click **Upload** (wait 10-20 minutes)

### Step 8: Configure TestFlight

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Open your app → **TestFlight** tab
3. Wait for **Processing** (5-30 minutes)
4. Click build number → **Export Compliance** → Select **No**

### Step 9: Add Testers

**Internal Testers** (up to 100, immediate):
- Go to **Internal Testing** → Add testers

**External Testers** (up to 10,000, requires review):
- Create group → Add build → Add emails → Submit for Beta Review

### Step 10: Testers Install

Testers receive email invitation to:
1. Download **TestFlight** app from App Store
2. Accept invitation
3. Install Loretta

### Updating the App

For each new version:
```bash
npm run build
npx cap sync ios
npx cap open ios
```
Then increment Build number and archive again.

---

## App Store Submission (Full Release)

When you're ready to publish:
- **iOS**: Requires $99/year Apple Developer account
- **Android**: Requires $25 one-time Google Play Developer account

The submission process involves creating app listings, screenshots, and going through review.
