import { useState, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

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
          });
          resolve({ latitude, longitude });
        },
        (error) => {
          let errorMessage: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting location.';
          }
          setState({
            latitude: null,
            longitude: null,
            accuracy: null,
            error: errorMessage,
            loading: false,
          });
          resolve(null);
        },
        {
          enableHighAccuracy: options.enableHighAccuracy ?? false,
          timeout: options.timeout ?? 10000,
          maximumAge: options.maximumAge ?? 300000,
        }
      );
    });
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge]);

  return {
    ...state,
    requestLocation,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  };
}
