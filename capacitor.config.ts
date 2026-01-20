import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lorettahealth.healthnavigator',
  appName: 'Loretta',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false,
    hostname: 'loretta.app',
    allowNavigation: [
      'loretta-care.replit.app',
      '*.replit.app',
      '*.replit.dev'
    ]
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#013DC4'
  },
  android: {
    backgroundColor: '#013DC4',
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#013DC4',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#013DC4'
    }
  }
};

export default config;
