import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n/config";
import { initClarity } from "./lib/clarity";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

initClarity();

const initMobileApp = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#013DC4' });
    } catch (e) {
      console.log('StatusBar not available');
    }
    
    try {
      await SplashScreen.hide();
    } catch (e) {
      console.log('SplashScreen not available');
    }
  }
};

initMobileApp();

createRoot(document.getElementById("root")!).render(<App />);
