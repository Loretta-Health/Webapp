import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useLocation } from 'wouter';

export function useAndroidBackButton() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const handleBackButton = App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else if (location === '/' || location === '/my-dashboard') {
        App.minimizeApp();
      } else {
        setLocation('/my-dashboard');
      }
    });

    return () => {
      handleBackButton.then(listener => listener.remove());
    };
  }, [location, setLocation]);
}
