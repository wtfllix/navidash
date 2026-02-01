'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Droplets,
  Thermometer,
  CloudFog,
  Moon
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

// QWeather API Response Types
interface QWeatherNow {
  obsTime: string;
  temp: string;
  feelsLike: string;
  icon: string;
  text: string;
  windDir: string;
  windScale: string;
  humidity: string;
  pressure: string;
  vis: string;
  cloud: string;
  dew: string;
}

interface WeatherData {
  current: QWeatherNow;
}

// Map QWeather icons to Lucide icons
// Reference: https://dev.qweather.com/docs/resource/icons/
const getWeatherIcon = (iconCode: string, size: number = 24, className: string = "") => {
  // Convert string to number for range checking
  const code = parseInt(iconCode, 10);
  
  if (isNaN(code)) return <CloudSun className={`text-gray-500 ${className}`} size={size} />;

  // 100-149: Sunny/Clear
  if (code === 100) return <Sun className={`text-yellow-500 ${className}`} size={size} />; // Sunny
  if (code === 150) return <Moon className={`text-yellow-200 ${className}`} size={size} />; // Clear Night
  if (code >= 101 && code <= 149) return <CloudSun className={`text-orange-400 ${className}`} size={size} />; // Cloudy/Overcast

  // 300-399: Rain
  if (code >= 300 && code <= 304) return <CloudRain className={`text-blue-500 ${className}`} size={size} />; // Shower/Thundershower
  if (code >= 305 && code <= 318) return <CloudDrizzle className={`text-blue-400 ${className}`} size={size} />; // Rain

  // 400-499: Snow
  if (code >= 400 && code <= 499) return <CloudSnow className={`text-cyan-200 ${className}`} size={size} />; // Snow

  // 500-515: Haze/Fog
  if (code >= 500 && code <= 515) return <CloudFog className={`text-gray-400 ${className}`} size={size} />; // Fog/Haze

  // 800-807: Clouds (QWeather doesn't strictly follow this range but for safety)
  // Actually QWeather uses 101-104 for clouds mostly
  
  // Default fallback
  return <Cloud className={`text-gray-400 ${className}`} size={size} />;
};

// Weather Background Animation Component
const WeatherBackground = ({ iconCode }: { iconCode: string }) => {
  const code = parseInt(iconCode, 10);
  
  // Helper to generate particles
  const renderParticles = (count: number, type: 'rain' | 'snow' | 'star' | 'cloud') => {
    return [...Array(count)].map((_, i) => (
      <div
        key={i}
        className={`absolute rounded-full ${
          type === 'rain' ? 'bg-blue-200/40 w-0.5' : 
          type === 'snow' ? 'bg-white/60' : 
          type === 'star' ? 'bg-white/90' :
          'bg-white/10' // cloud
        }`}
        style={{
          left: `${Math.random() * 100}%`,
          top: type === 'cloud' ? `${Math.random() * 60}%` : undefined,
          width: type === 'cloud' ? `${50 + Math.random() * 100}px` : undefined,
          height: type === 'rain' ? `${10 + Math.random() * 10}px` : 
                  type === 'cloud' ? `${50 + Math.random() * 100}px` : 
                  type === 'snow' || type === 'star' ? `${2 + Math.random() * 3}px` : undefined,
          animation: type === 'rain' 
            ? `rain ${1.5 + Math.random() * 0.8}s linear infinite` 
            : type === 'snow'
            ? `snow ${3 + Math.random() * 5}s linear infinite`
            : type === 'star'
            ? `twinkle ${1 + Math.random() * 3}s ease-in-out infinite`
            : `float ${10 + Math.random() * 20}s ease-in-out infinite alternate`,
          animationDelay: `-${Math.random() * 5}s`,
          opacity: Math.random(),
        }}
      />
    ));
  };

  // Define animations styles inline
  const styles = `
    @keyframes rain {
      0% { transform: translateY(-20px); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(400px); opacity: 0; }
    }
    @keyframes snow {
      0% { transform: translateY(-20px) translateX(-10px); opacity: 0; }
      10% { opacity: 1; }
      100% { transform: translateY(400px) translateX(10px); opacity: 0; }
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    @keyframes float {
      0% { transform: translateX(-20px); }
      100% { transform: translateX(20px); }
    }
    @keyframes sun-pulse {
      0%, 100% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(1.2); opacity: 0.5; }
    }
  `;

  // Determine weather type
  const isRain = code >= 300 && code <= 399;
  const isSnow = code >= 400 && code <= 499;
  const isCloudy = (code >= 101 && code <= 104) || (code >= 500 && code <= 515); 
  const isNight = code === 150; 
  const isSunny = code === 100;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{styles}</style>
      
      {isRain && renderParticles(30, 'rain')}
      {isSnow && renderParticles(20, 'snow')}
      {isNight && renderParticles(25, 'star')}
      {isCloudy && renderParticles(5, 'cloud')}
      
      {isSunny && (
        <div 
          className="absolute -top-20 -right-20 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl"
          style={{ animation: 'sun-pulse 6s ease-in-out infinite' }}
        />
      )}
    </div>
  );
};

const WeatherWidget = React.memo(({ widget }: { widget: Widget }) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const t = useTranslations('Widgets');
  const locale = useLocale();

  const apiKey = widget.config?.apiKey;
  const lat = widget.config?.lat || 39.9042;
  const lon = widget.config?.lon || 116.4074;
  const city = widget.config?.city || 'Beijing';
  const weatherSub = widget.config?.weatherSub || 'free';
  const weatherCustomHost = widget.config?.weatherCustomHost;
  const weatherAuthType = widget.config?.weatherAuthType || 'param';

  useEffect(() => {
    const fetchWeather = async () => {
      if (!apiKey) {
        setLoading(false);
        return;
      }

      const cacheKey = `qweather_cache_${lat}_${lon}_${weatherSub}_${weatherCustomHost}_${weatherAuthType}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { timestamp, data } = JSON.parse(cached);
          // Cache validity: 30 minutes
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            setWeatherData(data);
            return;
          }
        } catch (e) {
          console.error('Cache parse error', e);
        }
      }

      try {
        setLoading(true);
        const lang = locale === 'zh' ? 'zh' : 'en';
        const location = `${Math.round(lon * 100) / 100},${Math.round(lat * 100) / 100}`;
        
        let baseUrl;
        if (weatherSub === 'custom' && weatherCustomHost) {
          // Ensure protocol is present
          let host = weatherCustomHost.trim();
          if (!/^https?:\/\//i.test(host)) {
            host = `https://${host}`;
          }
          baseUrl = host.replace(/\/+$/, ''); // Remove trailing slash
        } else {
          baseUrl = weatherSub === 'standard' ? 'https://api.qweather.com' : 'https://devapi.qweather.com';
        }
        
        // Prepare Headers
        const headers: HeadersInit = {};
        if (weatherAuthType === 'bearer') {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        // Prepare Query Params
        const queryParams = new URLSearchParams({
          location,
          lang,
        });
        
        // Only add key to params if not using Bearer
        if (weatherAuthType !== 'bearer') {
          queryParams.append('key', apiKey);
        }

        // Request for current weather only
        const nowUrl = `${baseUrl}/v7/weather/now?${queryParams.toString()}`;
        
        console.log('[WeatherWidget] Fetching:', nowUrl);

        const nowRes = await fetch(nowUrl, { headers });
        
        if (!nowRes.ok) {
          console.error('[WeatherWidget] API Error:', nowRes.status);
          throw new Error(`Weather API Error`);
        }

        const nowData = await nowRes.json();

        if (nowData.code !== '200') {
           console.error('[WeatherWidget] API Code Error:', nowData.code);
           throw new Error('API Code Error');
        }

        const combinedData: WeatherData = {
          current: nowData.now
        };

        console.log('[WeatherWidget] Data received:', combinedData);
        setWeatherData(combinedData);
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: combinedData
        }));
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
  }, [apiKey, lat, lon, locale, weatherSub, weatherCustomHost, weatherAuthType]);

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-white p-4 text-center">
        <CloudSun size={32} className="text-gray-300 mb-2" />
        <span className="text-xs text-gray-400">{t('api_key_placeholder')}</span>
      </div>
    );
  }

  if (loading && !weatherData) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-white text-red-400 p-4 text-center">
        <Cloud size={32} className="mb-2" />
        <span className="text-xs">{t('weather_error')}</span>
      </div>
    );
  }

  const { current } = weatherData;
  const { w, h } = widget.size;

  // Layout Modes
  const isCompact = w <= 2 && h <= 2; // 2x2 or smaller
  const isWide = w >= 3 && h <= 2;    // 3x2, 4x2 (Landscape)
  const isShort = h === 1;            // 150px height
  
  // Default is Portrait/Tall (e.g. 2x4) or Large (4x4)

  // Function to get background gradient based on weather code (simplified)
  const getBackgroundGradient = (iconCode: string) => {
    const code = parseInt(iconCode, 10);
    
    // Rain/Snow (300-499) -> Dark Slate
    if (code >= 300 && code <= 499) return 'from-slate-700 to-slate-900';
    
    // Night (150) -> Deep Indigo
    if (code === 150) return 'from-indigo-950 to-slate-900';
    
    // Sunny (100) -> Bright Blue
    if (code === 100) return 'from-blue-400 to-blue-600';
    
    // Overcast (104) or Fog/Haze (500+) -> Greyer
    if (code === 104 || (code >= 500 && code <= 515)) return 'from-slate-500 to-slate-700';
    
    // Cloudy (101-103) -> Muted Blue
    if (code >= 101 && code <= 149) return 'from-blue-500 to-slate-600';

    // Default
    return 'from-blue-400 to-blue-600';
  };

  const bgGradient = getBackgroundGradient(current.icon);

  return (
    <div className={`flex ${isWide ? 'flex-row' : 'flex-col'} h-full w-full bg-gradient-to-br ${bgGradient} text-white relative overflow-hidden transition-all duration-500`}>
      {/* Background decoration */}
      <WeatherBackground key={current.icon} iconCode={current.icon} />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Content Area */}
      {isShort ? (
        w === 1 ? (
          // 1x1 Tiny Layout
          <div className="flex flex-col items-center justify-between w-full h-full p-3 relative z-10">
             {/* Top: City */}
             <span className="text-xs font-semibold drop-shadow-sm truncate max-w-full opacity-90">
               {city}
             </span>
             
             {/* Middle: Icon & Temp */}
             <div className="flex items-center justify-center gap-1 -my-1">
                <div className="drop-shadow-md filter">
                   {getWeatherIcon(current.icon, 32, "text-white")}
                </div>
                <span className="text-2xl font-light tracking-tighter drop-shadow-md leading-none">
                  {current.temp}°
                </span>
             </div>

             {/* Bottom: Text & Humidity */}
             <div className="flex flex-col items-center gap-0.5 w-full">
               <span className="text-xs font-medium text-blue-50 truncate max-w-full">
                  {current.text}
               </span>
               <div className="flex items-center gap-1 text-[10px] text-blue-100/80">
                  <Droplets size={10} />
                  <span>{current.humidity}%</span>
               </div>
             </div>
          </div>
        ) : (
          // Optimized Horizontal Layout for Short (h=1) widgets (w >= 2)
          <div className="flex items-center justify-between w-full h-full p-4 relative z-10">
             {/* Left: Icon & Temp */}
             <div className="flex items-center gap-3 shrink-0">
                <div className="drop-shadow-lg filter shrink-0">
                  {getWeatherIcon(current.icon, 48, "text-white")}
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl font-light tracking-tighter drop-shadow-md leading-none">
                    {current.temp}°
                  </span>
                </div>
             </div>

             {/* Center: City & Text (Show if w >= 2) */}
             <div className="flex flex-col items-start justify-center px-4 border-l border-white/10 ml-4 min-w-0 flex-1">
                <span className="text-sm font-semibold tracking-wide drop-shadow-sm flex items-center gap-1 truncate w-full">
                   {city}
                </span>
                <span className="text-xs font-medium text-blue-100/90 capitalize truncate w-full">
                  {current.text}
                </span>
             </div>

             {/* Right: Details (Show if w >= 2 to maximize info) */}
             <div className="flex items-center gap-3 ml-auto text-xs text-blue-50 shrink-0">
                <div className="flex items-center gap-1">
                   <Droplets size={14} className="opacity-70" />
                   <span className="font-medium">{current.humidity}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind size={14} className="opacity-70" />
                  <span className="font-medium">{current.windScale}</span>
                </div>
             </div>
          </div>
        )
      ) : (
        // Standard Layout for Taller Widgets
        <div className={`flex flex-col w-full h-full relative z-10`}>
          
          {/* Current Weather Section - Takes full height now */}
          <div className={`flex flex-col w-full h-full transition-all duration-300`}>
            {/* Header: City & Date */}
            <div className={`flex items-start justify-between ${isCompact ? 'p-3 pb-0' : 'p-4 pb-0'} z-10 shrink-0`}>
              <div className="flex flex-col">
                <span className={`${isCompact ? 'text-sm' : 'text-xl'} font-semibold tracking-wide drop-shadow-sm flex items-center gap-1`}>
                   {city}
                </span>
                <span className="text-xs text-blue-100/80 font-medium">
                  {new Date().toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Main Weather Display */}
            <div className={`flex flex-col items-center justify-center flex-1 z-10 py-2`}>
              <div className={`flex items-center justify-center ${isCompact ? 'gap-2' : 'gap-6'}`}>
                <div className="drop-shadow-lg filter transform hover:scale-105 transition-transform duration-300">
                   {getWeatherIcon(current.icon, isCompact ? 64 : 96, "text-white")}
                </div>
                <div className="flex flex-col">
                  <span className={`${isCompact ? 'text-5xl' : 'text-8xl'} font-light tracking-tighter drop-shadow-md`}>
                    {current.temp}°
                  </span>
                  <span className={`${isCompact ? 'text-sm' : 'text-lg'} font-medium text-blue-100/90 capitalize mt-1 text-center`}>
                    {current.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className={`z-10 bg-white/10 backdrop-blur-md border border-white/10 shadow-lg shrink-0 ${isCompact ? 'mx-2 mb-2 rounded-xl p-2' : 'mx-6 mb-6 rounded-2xl p-4'}`}>
                <div className="flex items-center justify-between text-xs text-blue-50">
                  <div className="flex flex-col items-center gap-1 flex-1 border-r border-white/10">
                     <Droplets size={isCompact ? 14 : 18} className="opacity-70" />
                     <span className={`font-medium ${!isCompact && 'text-sm mt-1'}`}>{current.humidity}%</span>
                     {!isCompact && <span className="text-[10px] opacity-60">Humidity</span>}
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1 border-r border-white/10">
                     <Wind size={isCompact ? 14 : 18} className="opacity-70" />
                     <span className={`font-medium ${!isCompact && 'text-sm mt-1'}`}>{current.windScale}</span>
                     {!isCompact && <span className="text-[10px] opacity-60">Wind</span>}
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1 border-r border-white/10">
                     <Thermometer size={isCompact ? 14 : 18} className="opacity-70" />
                     <span className={`font-medium ${!isCompact && 'text-sm mt-1'}`}>{current.feelsLike}°</span>
                     {!isCompact && <span className="text-[10px] opacity-60">Feels Like</span>}
                  </div>
                   {/* Extra details for non-compact modes */}
                   {!isCompact && (
                     <div className="flex flex-col items-center gap-1 flex-1">
                        <Cloud size={18} className="opacity-70" />
                        <span className="font-medium text-sm mt-1">{current.cloud || '0'}%</span>
                        <span className="text-[10px] opacity-60">Cloud</span>
                     </div>
                   )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

WeatherWidget.displayName = 'WeatherWidget';

export default WeatherWidget;
