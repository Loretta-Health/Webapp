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
console.log('[Loretta] Platform:', Capacitor.getPlatform());
console.log('[Loretta] Is Native:', isNativePlatform());
console.log('[Loretta] API Base URL:', getApiUrl('/api/test'));

const initMobileApp = async () => {
  if (Capacitor.isNativePlatform()) {
    console.log('[Loretta] Initializing native app...');
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#013DC4' });
      console.log('[Loretta] StatusBar configured');
    } catch (e) {
      console.log('StatusBar not available');
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
