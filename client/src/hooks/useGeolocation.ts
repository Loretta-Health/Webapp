import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { NativeSettings, IOSSettings, AndroidSettings } from 'capacitor-native-settings';

export const BERLIN_COORDINATES = {
  latitude: 52.52,
  longitude: 13.405,
};

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  usingDefault: boolean;
  permissionDenied: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  defaultLocation?: { latitude: number; longitude: number };
}

const LOCATION_ENABLED_KEY = 'loretta_location_enabled';

export function useGeolocation(options: GeolocationOptions = {}) {
  const defaultLocation = options.defaultLocation || BERLIN_COORDINATES;
  const isNative = Capacitor.isNativePlatform();
  
  const [locationEnabled, setLocationEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(LOCATION_ENABLED_KEY);
    return stored === 'true';
  });

  const [state, setState] = useState<GeolocationState>({
    latitude: defaultLocation.latitude,
    longitude: defaultLocation.longitude,
    accuracy: null,
    error: null,
    loading: false,
    usingDefault: true,
    permissionDenied: false,
  });

  const openAppSettings = useCallback(async () => {
    try {
      await NativeSettings.open({
        optionIOS: IOSSettings.App,
        optionAndroid: AndroidSettings.ApplicationDetails,
      });
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
  }, []);

  const requestNativeLocation = useCallback(async (): Promise<{ latitude: number; longitude: number }> => {
    setState(prev => ({ ...prev, loading: true, error: null, permissionDenied: false }));

    try {
      const permissionStatus = await Geolocation.checkPermissions();
      
      if (permissionStatus.location === 'denied') {
        const requestResult = await Geolocation.requestPermissions();
        if (requestResult.location === 'denied') {
          setState({
            latitude: defaultLocation.latitude,
            longitude: defaultLocation.longitude,
            accuracy: null,
            error: 'Location permission denied. Tap to open Settings.',
            loading: false,
            usingDefault: true,
            permissionDenied: true,
          });
          return defaultLocation;
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy ?? false,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 300000,
      });

      const { latitude, longitude, accuracy } = position.coords;
      setState({
        latitude,
        longitude,
        accuracy,
        error: null,
        loading: false,
        usingDefault: false,
        permissionDenied: false,
      });
      return { latitude, longitude };
    } catch (error: any) {
      const errorMessage = error?.message || 'Could not get location. Using default location (Berlin).';
      const isDenied = errorMessage.toLowerCase().includes('denied') || 
                       errorMessage.toLowerCase().includes('permission') ||
                       (error?.code === 1);
      setState({
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude,
        accuracy: null,
        error: isDenied ? 'Location permission denied. Tap to open Settings.' : errorMessage,
        loading: false,
        usingDefault: true,
        permissionDenied: isDenied,
      });
      return defaultLocation;
    }
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge, defaultLocation]);

  const requestWebLocation = useCallback(async (): Promise<{ latitude: number; longitude: number }> => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude,
        error: 'Geolocation is not supported by your browser. Using default location.',
        loading: false,
        usingDefault: true,
        permissionDenied: false,
      }));
      return defaultLocation;
    }

    setState(prev => ({ ...prev, loading: true, error: null, permissionDenied: false }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setState({
            latitude,
            longitude,
            accuracy,
            error: null,
            loading: false,
            usingDefault: false,
            permissionDenied: false,
          });
          resolve({ latitude, longitude });
        },
        (error) => {
          let errorMessage: string;
          let isDenied = false;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Using default location (Berlin).';
              isDenied = true;
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Using default location (Berlin).';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Using default location (Berlin).';
              break;
            default:
              errorMessage = 'Could not get location. Using default location (Berlin).';
          }
          setState({
            latitude: defaultLocation.latitude,
            longitude: defaultLocation.longitude,
            accuracy: null,
            error: errorMessage,
            loading: false,
            usingDefault: true,
            permissionDenied: isDenied,
          });
          resolve(defaultLocation);
        },
        {
          enableHighAccuracy: options.enableHighAccuracy ?? false,
          timeout: options.timeout ?? 10000,
          maximumAge: options.maximumAge ?? 300000,
        }
      );
    });
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge, defaultLocation]);

  const requestLocation = useCallback(async (): Promise<{ latitude: number; longitude: number }> => {
    if (isNative) {
      return requestNativeLocation();
    }
    return requestWebLocation();
  }, [isNative, requestNativeLocation, requestWebLocation]);

  const toggleLocationEnabled = useCallback(async () => {
    if (state.permissionDenied && isNative) {
      await openAppSettings();
      return;
    }
    
    const newValue = !locationEnabled;
    setLocationEnabled(newValue);
    localStorage.setItem(LOCATION_ENABLED_KEY, String(newValue));
    
    if (newValue) {
      await requestLocation();
    } else {
      setState({
        latitude: defaultLocation.latitude,
        longitude: defaultLocation.longitude,
        accuracy: null,
        error: null,
        loading: false,
        usingDefault: true,
        permissionDenied: false,
      });
    }
  }, [locationEnabled, requestLocation, defaultLocation, state.permissionDenied, isNative, openAppSettings]);

  useEffect(() => {
    if (locationEnabled) {
      requestLocation();
    }
  }, []);

  return {
    ...state,
    locationEnabled,
    requestLocation,
    toggleLocationEnabled,
    openAppSettings,
    isNative,
    isSupported: isNative || (typeof navigator !== 'undefined' && 'geolocation' in navigator),
    coordinates: state.latitude && state.longitude 
      ? { latitude: state.latitude, longitude: state.longitude }
      : defaultLocation,
  };
}
