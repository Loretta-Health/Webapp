interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    is_day: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weathercode: number[];
    relativehumidity_2m: number[];
    apparent_temperature: number[];
    visibility: number[];
    uv_index: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
}

export interface WeatherData {
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
}

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
  weatherData: WeatherData;
}

const WEATHER_CODES: Record<number, { description: string; severity: 'good' | 'moderate' | 'bad' }> = {
  0: { description: 'Clear sky', severity: 'good' },
  1: { description: 'Mainly clear', severity: 'good' },
  2: { description: 'Partly cloudy', severity: 'good' },
  3: { description: 'Overcast', severity: 'good' },
  45: { description: 'Fog', severity: 'moderate' },
  48: { description: 'Depositing rime fog', severity: 'moderate' },
  51: { description: 'Light drizzle', severity: 'moderate' },
  53: { description: 'Moderate drizzle', severity: 'moderate' },
  55: { description: 'Dense drizzle', severity: 'bad' },
  56: { description: 'Light freezing drizzle', severity: 'bad' },
  57: { description: 'Dense freezing drizzle', severity: 'bad' },
  61: { description: 'Slight rain', severity: 'moderate' },
  63: { description: 'Moderate rain', severity: 'bad' },
  65: { description: 'Heavy rain', severity: 'bad' },
  66: { description: 'Light freezing rain', severity: 'bad' },
  67: { description: 'Heavy freezing rain', severity: 'bad' },
  71: { description: 'Slight snow', severity: 'moderate' },
  73: { description: 'Moderate snow', severity: 'bad' },
  75: { description: 'Heavy snow', severity: 'bad' },
  77: { description: 'Snow grains', severity: 'moderate' },
  80: { description: 'Slight rain showers', severity: 'moderate' },
  81: { description: 'Moderate rain showers', severity: 'bad' },
  82: { description: 'Violent rain showers', severity: 'bad' },
  85: { description: 'Slight snow showers', severity: 'moderate' },
  86: { description: 'Heavy snow showers', severity: 'bad' },
  95: { description: 'Thunderstorm', severity: 'bad' },
  96: { description: 'Thunderstorm with slight hail', severity: 'bad' },
  99: { description: 'Thunderstorm with heavy hail', severity: 'bad' },
};

export async function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', latitude.toString());
  url.searchParams.set('longitude', longitude.toString());
  url.searchParams.set('current_weather', 'true');
  url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,precipitation,weathercode,relativehumidity_2m,apparent_temperature,visibility,uv_index');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data: OpenMeteoResponse = await response.json();
  
  const hourlyData = data.hourly;
  
  // Find the correct hour index by matching current_weather.time with hourly timestamps
  const currentTime = data.current_weather.time;
  let currentHourIndex = hourlyData.time.findIndex(t => t === currentTime);
  
  // If exact match not found, find the closest timestamp
  if (currentHourIndex === -1) {
    const currentTimestamp = new Date(currentTime).getTime();
    let minDiff = Infinity;
    currentHourIndex = 0;
    
    for (let i = 0; i < hourlyData.time.length; i++) {
      const diff = Math.abs(new Date(hourlyData.time[i]).getTime() - currentTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        currentHourIndex = i;
      }
    }
  }
  
  const weatherCode = data.current_weather.weathercode;
  const weatherInfo = WEATHER_CODES[weatherCode] || { description: 'Unknown', severity: 'moderate' };

  return {
    temperature: data.current_weather.temperature,
    feelsLike: hourlyData.apparent_temperature[currentHourIndex] ?? data.current_weather.temperature,
    humidity: hourlyData.relativehumidity_2m[currentHourIndex] ?? 0,
    windSpeed: data.current_weather.windspeed,
    precipitation: hourlyData.precipitation[currentHourIndex] ?? 0,
    precipitationProbability: hourlyData.precipitation_probability[currentHourIndex] ?? 0,
    weatherCode,
    weatherDescription: weatherInfo.description,
    visibility: hourlyData.visibility[currentHourIndex] ?? 10000,
    uvIndex: hourlyData.uv_index[currentHourIndex] ?? 0,
    isDay: data.current_weather.is_day === 1,
    sunrise: data.daily.sunrise[0] ?? '',
    sunset: data.daily.sunset[0] ?? '',
  };
}

export function assessOutdoorActivity(weather: WeatherData): OutdoorActivityAssessment {
  const warnings: string[] = [];
  let score = 100;
  
  const conditions = {
    temperature: 'good' as 'good' | 'moderate' | 'bad',
    precipitation: 'good' as 'good' | 'moderate' | 'bad',
    wind: 'good' as 'good' | 'moderate' | 'bad',
    visibility: 'good' as 'good' | 'moderate' | 'bad',
    uvIndex: 'good' as 'good' | 'moderate' | 'bad',
  };

  const tempC = weather.temperature;
  if (tempC < 0) {
    score -= 40;
    conditions.temperature = 'bad';
    warnings.push('Freezing temperatures - dress warmly and limit exposure');
  } else if (tempC < 10) {
    score -= 20;
    conditions.temperature = 'moderate';
    warnings.push('Cold weather - wear layers');
  } else if (tempC > 35) {
    score -= 40;
    conditions.temperature = 'bad';
    warnings.push('Extreme heat - risk of heat exhaustion, stay hydrated');
  } else if (tempC > 30) {
    score -= 20;
    conditions.temperature = 'moderate';
    warnings.push('Hot weather - drink plenty of water');
  }

  if (weather.precipitationProbability > 70 || weather.precipitation > 2) {
    score -= 40;
    conditions.precipitation = 'bad';
    warnings.push('High chance of precipitation - bring rain gear or stay indoors');
  } else if (weather.precipitationProbability > 40 || weather.precipitation > 0.5) {
    score -= 20;
    conditions.precipitation = 'moderate';
    warnings.push('Possible precipitation - consider bringing an umbrella');
  }

  const windKmh = weather.windSpeed;
  if (windKmh > 50) {
    score -= 40;
    conditions.wind = 'bad';
    warnings.push('Strong winds - outdoor activities may be dangerous');
  } else if (windKmh > 30) {
    score -= 20;
    conditions.wind = 'moderate';
    warnings.push('Windy conditions - may affect some activities');
  }

  const visibilityKm = weather.visibility / 1000;
  if (visibilityKm < 1) {
    score -= 30;
    conditions.visibility = 'bad';
    warnings.push('Poor visibility - be cautious outdoors');
  } else if (visibilityKm < 5) {
    score -= 15;
    conditions.visibility = 'moderate';
    warnings.push('Reduced visibility');
  }

  if (weather.uvIndex >= 8) {
    score -= 25;
    conditions.uvIndex = 'bad';
    warnings.push('Very high UV index - wear sunscreen and limit sun exposure');
  } else if (weather.uvIndex >= 6) {
    score -= 10;
    conditions.uvIndex = 'moderate';
    warnings.push('High UV index - sun protection recommended');
  }

  const weatherInfo = WEATHER_CODES[weather.weatherCode];
  if (weatherInfo?.severity === 'bad') {
    score -= 30;
  } else if (weatherInfo?.severity === 'moderate') {
    score -= 15;
  }

  score = Math.max(0, Math.min(100, score));

  const isGoodForOutdoor = score >= 60;

  let reason: string;
  if (score >= 80) {
    reason = `Great conditions for outdoor activities! ${weather.weatherDescription}, ${Math.round(tempC)}°C.`;
  } else if (score >= 60) {
    reason = `Decent weather for outdoor activities. ${weather.weatherDescription}, ${Math.round(tempC)}°C. ${warnings[0] || ''}`;
  } else if (score >= 40) {
    reason = `Not ideal for outdoor activities. ${weather.weatherDescription}, ${Math.round(tempC)}°C. Consider indoor alternatives.`;
  } else {
    reason = `Poor conditions for outdoor activities. ${weather.weatherDescription}, ${Math.round(tempC)}°C. Indoor activities recommended.`;
  }

  return {
    isGoodForOutdoor,
    score,
    reason,
    warnings,
    conditions,
    weatherData: weather,
  };
}

export async function getOutdoorActivityAssessment(latitude: number, longitude: number): Promise<OutdoorActivityAssessment> {
  const weather = await fetchWeatherData(latitude, longitude);
  return assessOutdoorActivity(weather);
}
