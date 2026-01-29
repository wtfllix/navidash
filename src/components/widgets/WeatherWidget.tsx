'use client';

import React, { useEffect, useState } from 'react';
import { Widget } from '@/types';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudDrizzle, 
  Wind,
  Loader2,
  MapPin
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed: number;
}

const getWeatherIcon = (code: number, size: number = 48) => {
  if (code === 0) return <Sun className="text-yellow-500" size={size} />;
  if (code >= 1 && code <= 3) return <CloudSun className="text-orange-400" size={size} />;
  if (code >= 45 && code <= 48) return <Cloud className="text-gray-400" size={size} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className="text-blue-300" size={size} />;
  if (code >= 61 && code <= 67) return <CloudRain className="text-blue-500" size={size} />;
  if (code >= 71 && code <= 77) return <CloudSnow className="text-cyan-200" size={size} />;
  if (code >= 80 && code <= 82) return <CloudRain className="text-blue-600" size={size} />;
  if (code >= 95 && code <= 99) return <CloudLightning className="text-purple-500" size={size} />;
  return <CloudSun className="text-gray-500" size={size} />;
};

const WeatherWidget = React.memo(({ widget }: { widget: Widget }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const t = useTranslations('Widgets');

  const getWeatherDesc = (code: number) => {
    if (code === 0) return t('weather_clear');
    if (code >= 1 && code <= 3) return t('weather_cloudy');
    if (code >= 45 && code <= 48) return t('weather_fog');
    if (code >= 51 && code <= 57) return t('weather_drizzle');
    if (code >= 61 && code <= 67) return t('weather_rain');
    if (code >= 71 && code <= 77) return t('weather_snow');
    if (code >= 80 && code <= 82) return t('weather_rain');
    if (code >= 95 && code <= 99) return t('weather_thunderstorm');
    return t('weather_unknown');
  };

  // Default to Beijing if not configured
  // In a real app, we would use navigator.geolocation or IP-based location
  const lat = widget.config?.lat || 39.9042;
  const lon = widget.config?.lon || 116.4074;
  const city = widget.config?.city || 'Beijing';

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const data = await res.json();
        setWeather(data.current_weather);
        setError(false);
      } catch (err) {
        console.error('Failed to fetch weather', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lon]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white rounded-2xl shadow-sm border border-gray-100">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white rounded-2xl shadow-sm border border-gray-100 text-red-400">
        <Cloud size={32} />
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col items-center justify-center h-full w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 relative overflow-hidden group"
      role="region"
      aria-label={`${t('weather')} - ${city}`}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center text-gray-500 text-xs font-medium">
          <MapPin size={12} className="mr-1" />
          {city}
        </div>
        <div className="text-xs text-gray-400">
          {getWeatherDesc(weather.weathercode)}
        </div>
      </div>
      
      <div className="flex items-center justify-center flex-1 my-2">
        {getWeatherIcon(weather.weathercode)}
        <div className="ml-4">
          <div className="text-3xl font-bold text-gray-800 tracking-tighter">
            {Math.round(weather.temperature)}°
          </div>
          <div className="flex items-center text-gray-400 text-xs mt-1">
             <Wind size={12} className="mr-1" />
             {weather.windspeed} {t('unit_speed')}
          </div>
        </div>
      </div>
    </div>
  );
});

WeatherWidget.displayName = 'WeatherWidget';

export default WeatherWidget;
