import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n/config";
import { initClarity } from "./lib/clarity";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { getApiUrl, isNativePlatform } from "./lib/queryClient";

initClarity();

// Debug: Log platform and API configuration
const platform = Capacitor.getPlatform();
console.log('[Loretta] Platform:', platform);
console.log('[Loretta] Is Native:', isNativePlatform());
console.log('[Loretta] API Base URL:', getApiUrl('/api/test'));

// Add platform class to body for CSS targeting
if (platform === 'android') {
  document.body.classList.add('capacitor-android');
  console.log('[Loretta] Added capacitor-android class to body');
} else if (platform === 'ios') {
  document.body.classList.add('capacitor-ios');
  console.log('[Loretta] Added capacitor-ios class to body');
}

const initMobileApp = async () => {
  if (Capacitor.isNativePlatform()) {
    console.log('[Loretta] Initializing native app...');
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#013DC4' });
      // On Android, make status bar overlay content for edge-to-edge
      if (platform === 'android') {
        await StatusBar.setOverlaysWebView({ overlay: true });
        console.log('[Loretta] Android StatusBar set to overlay mode');
      }
      console.log('[Loretta] StatusBar configured');
    } catch (e) {
      console.log('StatusBar not available:', e);
    }
    
    try {
      await SplashScreen.hide();
      console.log('[Loretta] SplashScreen hidden');
    } catch (e) {
      console.log('SplashScreen not available');
    }
  }
};

initMobileApp();

createRoot(document.getElementById("root")!).render(<App />);
