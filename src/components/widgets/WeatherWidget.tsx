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

const getWeatherDesc = (code: number) => {
  const codes: Record<number, string> = {
    0: '晴朗',
    1: '多云', 2: '多云', 3: '阴',
    45: '雾', 48: '雾',
    51: '小雨', 53: '中雨', 55: '大雨',
    61: '小雨', 63: '中雨', 65: '大雨',
    71: '小雪', 73: '中雪', 75: '大雪',
    95: '雷雨', 96: '雷雨', 99: '雷雨'
  };
  return codes[code] || '未知';
};

export default function WeatherWidget({ widget }: { widget: Widget }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Default to Beijing if not configured
  // In a real app, we would use navigator.geolocation or IP-based location
  const lat = widget.config?.lat || 39.9042;
  const lon = widget.config?.lon || 116.4074;
  const city = widget.config?.city || 'Beijing';

  useEffect(() => {
    const fetchWeather = async () => {
      // Demo mode or fallback mock data
      const mockData: WeatherData = {
        temperature: 26,
        weathercode: 1, // Sunny/Cloudy
        windspeed: 5.5
      };

      try {
        setLoading(true);
        
        // If in Demo Mode, use mock data directly
        if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
           // Simulate network delay
           await new Promise(resolve => setTimeout(resolve, 500));
           setWeather(mockData);
           setError(false);
           return;
        }

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        
        if (!res.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await res.json();
        setWeather(data.current_weather);
        setError(false);
      } catch (err) {
        console.error('Failed to fetch weather, using mock data', err);
        // Fallback to mock data on error
        setWeather(mockData);
        setError(false);
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
    <div className="flex flex-col items-center justify-center h-full w-full bg-white rounded-xl shadow-sm border border-gray-100 p-3 relative overflow-hidden group">
      <div className="z-10 flex flex-col items-center justify-between h-full py-1">
        <div className="transform group-hover:scale-110 transition-transform duration-300">
          {getWeatherIcon(weather.weathercode, 32)}
        </div>
        
        <div className="text-2xl font-bold text-gray-800 tracking-tight leading-none">
          {weather.temperature}°
        </div>
        
        <div className="text-xs font-medium text-gray-500 flex items-center space-x-1">
          <span>{getWeatherDesc(weather.weathercode)}</span>
        </div>

        <div className="flex items-center text-[10px] text-gray-400 mt-auto">
           <MapPin size={10} className="mr-0.5" />
           <span className="truncate max-w-[80px]">{city}</span>
        </div>
      </div>
    </div>
  );
}
