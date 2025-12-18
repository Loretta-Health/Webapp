import { createContext, useContext, useState, ReactNode } from 'react';

interface WeatherSimulationContextType {
  simulateBadWeather: boolean;
  setSimulateBadWeather: (value: boolean) => void;
}

const WeatherSimulationContext = createContext<WeatherSimulationContextType | null>(null);

export function WeatherSimulationProvider({ children }: { children: ReactNode }) {
  const [simulateBadWeather, setSimulateBadWeather] = useState(false);

  return (
    <WeatherSimulationContext.Provider value={{ simulateBadWeather, setSimulateBadWeather }}>
      {children}
    </WeatherSimulationContext.Provider>
  );
}

export function useWeatherSimulation() {
  const context = useContext(WeatherSimulationContext);
  if (!context) {
    throw new Error('useWeatherSimulation must be used within a WeatherSimulationProvider');
  }
  return context;
}
