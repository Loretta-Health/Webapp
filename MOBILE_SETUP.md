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

## App Store Submission (Later)

When you're ready to publish:
- **iOS**: Requires $99/year Apple Developer account
- **Android**: Requires $25 one-time Google Play Developer account

The submission process involves creating app listings, screenshots, and going through review.
