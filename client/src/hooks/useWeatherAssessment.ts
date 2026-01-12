import { useQuery } from '@tanstack/react-query';
import { useGeolocation, BERLIN_COORDINATES } from './useGeolocation';
import { getApiUrl } from '@/lib/queryClient';

export interface OutdoorActivityAssessment {
  isGoodForOutdoor: boolean;
  score: number;
  reason: string;
  warnings: string[];
  conditions: {
    temperature: 'good' | 'moderate' | 'bad';
    precipitation: 'good' | 'moderate' | 'bad';
    wind: 'good' | 'moderate' | 'bad';
    visibility: 'good' | 'moderate' | 'bad';
    uvIndex: 'good' | 'moderate' | 'bad';
  };
  weatherData: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    precipitationProbability: number;
    weatherCode: number;
    weatherDescription: string;
    visibility: number;
    uvIndex: number;
    isDay: boolean;
    sunrise: string;
    sunset: string;
  };
}

export function useWeatherAssessment() {
  const { coordinates, locationEnabled, usingDefault } = useGeolocation();

  const { data: assessment, isLoading, error, refetch } = useQuery<OutdoorActivityAssessment>({
    queryKey: ['weather-assessment', coordinates.latitude, coordinates.longitude],
    queryFn: async () => {
      const response = await fetch(
        getApiUrl(`/api/weather/outdoor-assessment?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`),
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather assessment');
      }
      
      return response.json();
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    refetchOnMount: 'always',
    retry: 2,
  });

  const isBadWeather = assessment ? !assessment.isGoodForOutdoor : false;
  const weatherScore = assessment?.score ?? 100;

  return {
    assessment,
    isBadWeather,
    weatherScore,
    isLoading,
    error,
    refetch,
    coordinates,
    locationEnabled,
    usingDefault,
  };
}
