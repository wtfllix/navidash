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
  const renderParticles = (count: number, type: 'rain' | 'snow' | 'star' | 'cloud' | 'fog' | 'meteor') => {
    return [...Array(count)].map((_, i) => {
      if (type === 'cloud') {
        const size = 60 + Math.random() * 100;
        return (
          <Cloud 
            key={i}
            className="absolute text-white/20"
            size={size}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              animation: `drift ${20 + Math.random() * 20}s ease-in-out infinite alternate`,
              animationDelay: `-${Math.random() * 20}s`,
            }}
          />
        );
      }

      if (type === 'meteor') {
        return (
          <div
            key={i}
            className="absolute h-0.5 bg-gradient-to-l from-white to-transparent rounded-full"
            style={{
              width: `${50 + Math.random() * 50}px`,
              right: `${-10 + Math.random() * 50}%`,
              top: `${Math.random() * 50}%`,
              transform: 'rotate(-45deg)',
              animation: `meteor ${2 + Math.random() * 4}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
              opacity: 0,
            }}
          />
        );
      }
      
      return (
        <div
          key={i}
          className={`absolute rounded-full ${
            type === 'rain' ? 'bg-blue-200/60 w-0.5' : 
            type === 'snow' ? 'bg-white/80' : 
            type === 'star' ? 'bg-white/90' :
            'bg-white/10' 
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: type === 'fog' ? `${Math.random() * 100}%` : undefined,
            width: type === 'fog' ? `${100 + Math.random() * 200}px` : undefined,
            height: type === 'rain' ? `${15 + Math.random() * 15}px` : 
                    type === 'fog' ? `${10 + Math.random() * 20}px` : 
                    type === 'snow' || type === 'star' ? `${2 + Math.random() * 3}px` : undefined,
            animation: type === 'rain' 
              ? `rain ${0.8 + Math.random() * 0.5}s linear infinite` 
              : type === 'snow'
              ? `snow ${3 + Math.random() * 5}s linear infinite`
              : type === 'star'
              ? `twinkle ${1 + Math.random() * 3}s ease-in-out infinite`
              : `float ${10 + Math.random() * 20}s ease-in-out infinite alternate`,
            animationDelay: `-${Math.random() * 5}s`,
            opacity: type === 'fog' ? 0.3 : Math.random(),
            transform: type === 'rain' ? 'rotate(15deg)' : undefined,
          }}
        />
      );
    });
  };

  // Define animations styles inline
  const styles = `
    @keyframes rain {
      0% { transform: translateY(-20px) rotate(15deg); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(400px) rotate(15deg); opacity: 0; }
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
    @keyframes drift {
      0% { transform: translateX(-30px); }
      100% { transform: translateX(30px); }
    }
    @keyframes float {
      0% { transform: translateX(-20px); }
      100% { transform: translateX(20px); }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes lightning {
      0%, 90%, 100% { background-color: transparent; }
      92%, 94% { background-color: rgba(255, 255, 255, 0.3); }
      93%, 95% { background-color: transparent; }
    }
    @keyframes meteor {
      0% { transform: translateX(0) translateY(0) rotate(-45deg); opacity: 1; }
      20% { opacity: 0; }
      100% { transform: translateX(-200px) translateY(200px) rotate(-45deg); opacity: 0; }
    }
    @keyframes moon-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `;

  // Determine weather type
  const isRain = code >= 300 && code <= 399;
  const isSnow = code >= 400 && code <= 499;
  const isThunder = (code >= 302 && code <= 304) || code === 399;
  const isFog = code >= 500 && code <= 515;
  const isNight = code >= 150 && code <= 153;
  const isCloudy = (code >= 101 && code <= 104) || (code >= 151 && code <= 153) || isFog; 
  const isSunny = code === 100;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${isThunder ? 'animate-[lightning_5s_infinite]' : ''}`}>
      <style>{styles}</style>
      
      {isRain && renderParticles(40, 'rain')}
      {isSnow && renderParticles(30, 'snow')}
      {isNight && renderParticles(30, 'star')}
      {isNight && renderParticles(2, 'meteor')}
      {(isCloudy || isFog) && renderParticles(isFog ? 10 : 6, isFog ? 'fog' : 'cloud')}
      
      {isSunny && (
        <>
          <div 
            className="absolute -top-10 -right-10 text-yellow-500/20"
            style={{ animation: 'spin-slow 20s linear infinite' }}
          >
            <Sun size={200} />
          </div>
          <div 
            className="absolute -top-20 -right-20 w-80 h-80 bg-yellow-400/30 rounded-full blur-3xl"
            style={{ animation: 'twinkle 4s ease-in-out infinite' }}
          />
        </>
      )}

      {isNight && (
        <>
          <div 
            className="absolute top-4 right-4 text-yellow-100/30"
            style={{ animation: 'moon-float 6s ease-in-out infinite' }}
          >
            <Moon size={60} />
          </div>
          <div 
            className="absolute top-2 right-2 w-24 h-24 bg-yellow-100/10 rounded-full blur-2xl"
            style={{ animation: 'twinkle 5s ease-in-out infinite' }}
          />
        </>
      )}
      
      {isThunder && (
         <div 
           className="absolute inset-0 bg-white/0"
           style={{ animation: 'lightning 8s infinite' }}
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
        if (weatherCustomHost && weatherCustomHost.trim()) {
          // Ensure protocol is present
          let host = weatherCustomHost.trim();
          if (!/^https?:\/\//i.test(host)) {
            host = `https://${host}`;
          }
          baseUrl = host.replace(/\/+$/, ''); // Remove trailing slash
        } else {
          baseUrl = 'https://devapi.qweather.com';
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
  const isTinyWidth = w === 1;        // Single column width
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
        ) : w === 2 ? (
          // New 1x2 Specific Layout (Left: Info, Right: Visual)
          <div className="flex items-center justify-between w-full h-full p-3 relative z-10">
             {/* Left: City & Info (Takes priority space) */}
             <div className="flex flex-col justify-center min-w-0 flex-1 mr-2">
                <span className="text-lg font-semibold tracking-wide drop-shadow-sm truncate w-full leading-tight" title={city}>
                   {city}
                </span>
                <span className="text-xs text-blue-100/80 font-medium truncate w-full mb-1.5">
                  {current.text}
                </span>
                {/* Micro Details */}
                <div className="flex items-center gap-3 text-[10px] text-blue-50/70">
                   <div className="flex items-center gap-1">
                      <Droplets size={10} />
                      <span>{current.humidity}%</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <Wind size={10} />
                      <span>{current.windScale}</span>
                   </div>
                </div>
             </div>

             {/* Right: Temp & Icon */}
             <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="drop-shadow-lg filter">
                  {getWeatherIcon(current.icon, 32, "text-white")}
                </div>
                <span className="text-3xl font-light tracking-tighter drop-shadow-md leading-none">
                  {current.temp}°
                </span>
             </div>
          </div>
        ) : w === 3 ? (
          // Optimized 1x3 Layout: City-First Hybrid
          <div className="flex justify-between w-full h-full p-4 relative z-10">
             {/* Left Group: City & Main Info */}
             <div className="flex flex-col justify-between flex-1 min-w-0 mr-4">
                {/* Top: City Name & Text */}
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-xl font-bold tracking-wide drop-shadow-md truncate leading-tight" title={city}>
                      {city}
                   </span>
                   <span className="text-sm font-medium text-blue-100/80 shrink-0">
                     {current.text}
                   </span>
                </div>
                
                {/* Bottom: Temp & Icon */}
                <div className="flex items-center gap-3">
                   <div className="drop-shadow-lg filter">
                     {getWeatherIcon(current.icon, 36, "text-white")}
                   </div>
                   <span className="text-4xl font-light tracking-tighter drop-shadow-md leading-none">
                     {current.temp}°
                   </span>
                </div>
             </div>

             {/* Right Group: Details */}
             <div className="flex flex-col justify-end items-end shrink-0 py-1">
                {/* Details Stack */}
                <div className="flex flex-col items-end gap-1.5 text-xs text-blue-50 font-medium">
                   <div className="flex items-center gap-1.5">
                      <Droplets size={14} className="opacity-70" />
                      <span>{current.humidity}%</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <Wind size={14} className="opacity-70" />
                      <span>{current.windScale}</span>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          // Standard Wide Layout (w >= 4)
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

             {/* Center: City & Text */}
             <div className="flex flex-col items-start justify-center px-4 border-l border-white/10 ml-4 min-w-0 flex-1">
                <span className="text-sm font-semibold tracking-wide drop-shadow-sm flex items-center gap-1 truncate w-full">
                   {city}
                </span>
                <span className="text-xs font-medium text-blue-100/90 capitalize truncate w-full">
                  {current.text}
                </span>
             </div>

             {/* Right: Details */}
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
            <div className={`flex items-start justify-between ${isCompact ? 'p-3 pb-0' : 'p-4 pb-0'} z-10 shrink-0 w-full`}>
              <div className="flex flex-col min-w-0 w-full">
                <span className={`${isCompact ? 'text-sm' : 'text-xl'} font-semibold tracking-wide drop-shadow-sm truncate block w-full`} title={city}>
                   {city}
                </span>
                <span className="text-xs text-blue-100/80 font-medium truncate block w-full">
                  {new Date().toLocaleDateString(locale, { weekday: isTinyWidth ? 'short' : 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Main Weather Display */}
            <div className={`flex flex-col items-center justify-center flex-1 z-10 py-2 min-h-0`}>
              <div className={`flex ${isTinyWidth ? 'flex-col gap-0' : 'items-center justify-center gap-2'} ${!isCompact && 'gap-6'}`}>
                <div className="drop-shadow-lg filter transform hover:scale-105 transition-transform duration-300">
                   {getWeatherIcon(current.icon, isTinyWidth ? 48 : (isCompact ? 64 : 96), "text-white")}
                </div>
                <div className={`flex flex-col ${isTinyWidth ? 'items-center' : ''}`}>
                  <span className={`${isTinyWidth ? 'text-4xl' : (isCompact ? 'text-5xl' : 'text-8xl')} font-light tracking-tighter drop-shadow-md`}>
                    {current.temp}°
                  </span>
                  <span className={`${isCompact ? 'text-sm' : 'text-lg'} font-medium text-blue-100/90 capitalize mt-1 text-center truncate max-w-full px-2`}>
                    {current.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className={`z-10 bg-white/10 backdrop-blur-md border border-white/10 shadow-lg shrink-0 ${isCompact ? (isTinyWidth ? 'mx-1 mb-1 rounded-lg p-1' : 'mx-2 mb-2 rounded-xl p-2') : 'mx-6 mb-6 rounded-2xl p-4'}`}>
                <div className="flex items-center justify-between text-xs text-blue-50">
                  <div className="flex flex-col items-center gap-0.5 flex-1 border-r border-white/10">
                     <Droplets size={isTinyWidth ? 12 : (isCompact ? 14 : 18)} className="opacity-70" />
                     <span className={`font-medium ${!isCompact && 'text-sm mt-1'} ${isTinyWidth && 'text-[10px] leading-tight'}`}>{current.humidity}%</span>
                     {!isCompact && <span className="text-[10px] opacity-60">Humidity</span>}
                  </div>
                  <div className="flex flex-col items-center gap-0.5 flex-1 border-r border-white/10">
                     <Wind size={isTinyWidth ? 12 : (isCompact ? 14 : 18)} className="opacity-70" />
                     <span className={`font-medium ${!isCompact && 'text-sm mt-1'} ${isTinyWidth && 'text-[10px] leading-tight'}`}>{current.windScale}</span>
                     {!isCompact && <span className="text-[10px] opacity-60">Wind</span>}
                  </div>
                  <div className="flex flex-col items-center gap-0.5 flex-1">
                     <Thermometer size={isTinyWidth ? 12 : (isCompact ? 14 : 18)} className="opacity-70" />
                     <span className={`font-medium ${!isCompact && 'text-sm mt-1'} ${isTinyWidth && 'text-[10px] leading-tight'}`}>{current.feelsLike}°</span>
                     {!isCompact && <span className="text-[10px] opacity-60">Feels Like</span>}
                  </div>
                   {/* Extra details for non-compact modes */}
                   {!isCompact && (
                     <div className="flex flex-col items-center gap-1 flex-1 border-l border-white/10">
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
