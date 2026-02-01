'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Widget } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useTranslations, useLocale } from 'next-intl';

interface WidgetSettingsModalProps {
  widget: Widget | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WidgetSettingsModal({ widget, isOpen, onClose }: WidgetSettingsModalProps) {
  const { updateWidget } = useWidgetStore();
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [config, setConfig] = useState<Record<string, any>>({});
  const [citySearch, setCitySearch] = useState('');
  const [showCityList, setShowCityList] = useState(false);
  const tWidgets = useTranslations('Widgets');
  const locale = useLocale();

  useEffect(() => {
    if (widget) {
      setSize(widget.size);
      setConfig(widget.config || {});
    }
  }, [widget]);

  if (!widget) return null;

  // Preset Cities Data (Expanded)
  const PRESET_CITIES = [
    // China - Tier 1
    { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
    { name: 'Shanghai', lat: 31.2304, lon: 121.4737 },
    { name: 'Guangzhou', lat: 23.1291, lon: 113.2644 },
    { name: 'Shenzhen', lat: 22.5431, lon: 114.0579 },
    // China - Major
    { name: 'Chengdu', lat: 30.5728, lon: 104.0668 },
    { name: 'Hangzhou', lat: 30.2741, lon: 120.1551 },
    { name: 'Wuhan', lat: 30.5928, lon: 114.3055 },
    { name: 'Xi\'an', lat: 34.3416, lon: 108.9398 },
    { name: 'Chongqing', lat: 29.5630, lon: 106.5516 },
    { name: 'Nanjing', lat: 32.0603, lon: 118.7969 },
    { name: 'Tianjin', lat: 39.0842, lon: 117.2009 },
    { name: 'Suzhou', lat: 31.2989, lon: 120.5853 },
    { name: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
    { name: 'Taipei', lat: 25.0330, lon: 121.5654 },
    { name: 'Macau', lat: 22.1987, lon: 113.5439 },
    { name: 'Qingdao', lat: 36.0671, lon: 120.3826 },
    { name: 'Xiamen', lat: 24.4798, lon: 118.0894 },
    { name: 'Changsha', lat: 28.2282, lon: 112.9388 },
    { name: 'Kunming', lat: 24.8801, lon: 102.8329 },
    { name: 'Sanya', lat: 18.2528, lon: 109.5120 },
    // Asia
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Osaka', lat: 34.6937, lon: 135.5023 },
    { name: 'Seoul', lat: 37.5665, lon: 126.9780 },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
    { name: 'Bangkok', lat: 13.7563, lon: 100.5018 },
    { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
    // North America
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
    { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
    { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
    { name: 'Vancouver', lat: 49.2827, lon: -123.1207 },
    // Europe
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Berlin', lat: 52.5200, lon: 13.4050 },
    { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
    { name: 'Madrid', lat: 40.4168, lon: -3.7038 },
    { name: 'Rome', lat: 41.9028, lon: 12.4964 },
    // Oceania
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
    { name: 'Melbourne', lat: -37.8136, lon: 144.9631 },
  ];

  const filteredCities = PRESET_CITIES.filter(c => 
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleSave = () => {
    let finalConfig = { ...config };
    
    // If city name matches a preset, ensure coordinates match (auto-fix coordinates)
    if (widget.type === 'weather' && finalConfig.city) {
      const matchedCity = PRESET_CITIES.find(c => c.name.toLowerCase() === finalConfig.city.toLowerCase());
      if (matchedCity) {
         finalConfig.lat = matchedCity.lat;
         finalConfig.lon = matchedCity.lon;
         finalConfig.city = matchedCity.name; // Normalize casing
      }
    }

    updateWidget(widget.id, { size, config: finalConfig });
    onClose();
  };

  const selectCity = (city: typeof PRESET_CITIES[0]) => {
    setConfig({
      ...config,
      city: city.name,
      lat: city.lat,
      lon: city.lon
    });
    setCitySearch('');
    setShowCityList(false);
  };

  const COLOR_OPTIONS = [
    { color: '#ef4444', label: 'Red' },
    { color: '#3b82f6', label: 'Blue' },
    { color: '#22c55e', label: 'Green' },
    { color: '#f97316', label: 'Orange' },
    { color: '#a855f7', label: 'Purple' },
    { color: '#1f2937', label: 'Black' },
  ];

  const renderConfigFields = () => {
    switch (widget.type) {
      case 'clock':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tWidgets('clock_style')}</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setConfig({ ...config, clockStyle: 'digital' })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  (config.clockStyle || 'digital') === 'digital'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tWidgets('style_digital')}
              </button>
              <button
                onClick={() => setConfig({ ...config, clockStyle: 'analog' })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  config.clockStyle === 'analog'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tWidgets('style_analog')}
              </button>
            </div>
          </div>
        );
      case 'date':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{tWidgets('theme_color')}</label>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.color}
                  onClick={() => setConfig({ ...config, color: option.color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    (config.color || '#ef4444') === option.color
                      ? 'border-gray-600 scale-110 shadow-sm'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: option.color }}
                  title={option.label}
                  aria-label={option.label}
                />
              ))}
            </div>
          </div>
        );
      case 'weather':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('api_key')}</label>
              <input
                type="text"
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder={tWidgets('api_key_placeholder')}
                aria-label={tWidgets('api_key')}
              />
              <p className="text-xs text-gray-500 mt-1">
                {tWidgets.rich('api_requirement', {
                  link: (chunks: React.ReactNode) => (
                    <a 
                      href="https://console.qweather.com/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-500 hover:underline"
                    >
                      {chunks}
                    </a>
                  )
                })}
              </p>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('subscription_type')}</label>
              <select
                value={config.weatherSub || 'free'}
                onChange={(e) => setConfig({ ...config, weatherSub: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                <option value="free">{tWidgets('sub_free')}</option>
                <option value="standard">{tWidgets('sub_standard')}</option>
                <option value="custom">{tWidgets('sub_custom')}</option>
              </select>
            </div>
            
            {config.weatherSub === 'custom' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('sub_custom')}</label>
                <input
                  type="text"
                  value={config.weatherCustomHost || ''}
                  onChange={(e) => setConfig({ ...config, weatherCustomHost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder={tWidgets('custom_host_placeholder')}
                />
              </div>
            )}

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('auth_type')}</label>
              <select
                value={config.weatherAuthType || 'param'}
                onChange={(e) => setConfig({ ...config, weatherAuthType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                <option value="param">{tWidgets('auth_param')}</option>
                <option value="bearer">{tWidgets('auth_bearer')}</option>
              </select>
            </div>

            <div className="mt-3 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('city_name')}</label>
              
              <div className="relative">
                <input
                  type="text"
                  value={showCityList ? citySearch : (config.city || '')}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    if (!showCityList) setShowCityList(true);
                  }}
                  onFocus={() => {
                    setCitySearch('');
                    setShowCityList(true);
                  }}
                  onBlur={() => setTimeout(() => setShowCityList(false), 200)} // Delay to allow click
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder={tWidgets('quick_select_city') || 'Search City...'}
                  autoComplete="off"
                />
                
                {showCityList && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCities.length > 0 ? (
                      filteredCities.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => selectCity(c)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 transition-colors"
                        >
                          <span className="font-medium">{c.name}</span>
                          {/* <span className="text-xs text-gray-400 ml-2">({c.lat}, {c.lon})</span> */}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No cities found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
             <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('latitude')}</label>
                  <input
                    type="number"
                    value={config.lat || ''}
                    onChange={(e) => setConfig({ ...config, lat: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    aria-label={tWidgets('latitude')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('longitude')}</label>
                  <input
                    type="number"
                    value={config.lon || ''}
                    onChange={(e) => setConfig({ ...config, lon: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    aria-label={tWidgets('longitude')}
                  />
                </div>
             </div>
             <p className="text-xs text-gray-500 mt-2">
               {tWidgets('find_coords')} <a href="https://www.latlong.net/" target="_blank" className="text-blue-500 underline">latlong.net</a>
             </p>
          </>
        );
      case 'quick-link':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('widget_title')}</label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                aria-label={tWidgets('widget_title')}
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('widget_url')}</label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="https://..."
                aria-label={tWidgets('widget_url')}
              />
            </div>
          </>
        );
      case 'photo-frame':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('image_url')}</label>
            <input
              type="text"
              value={config.imageUrl || ''}
              onChange={(e) => setConfig({ ...config, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              placeholder="https://..."
              aria-label={tWidgets('image_url')}
            />
          </div>
        );
      default:
        return <p className="text-sm text-gray-500">{tWidgets('no_config')}</p>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tWidgets('title_edit', { type: widget.type })}>
      <div className="space-y-6">
        {/* Size Config */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">{tWidgets('size')}</h4>
          <div className="flex items-center space-x-4">
             <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">{tWidgets('width_cols')}</label>
                <select 
                  value={size.w}
                  onChange={(e) => setSize({ ...size, w: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value={1}>{tWidgets('size_small')}</option>
                  <option value={2}>{tWidgets('size_medium')}</option>
                  <option value={4}>{tWidgets('size_full')}</option>
                </select>
             </div>
             <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">{tWidgets('height_rows')}</label>
                <select 
                  value={size.h}
                  onChange={(e) => setSize({ ...size, h: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value={1}>{tWidgets('size_standard')}</option>
                  <option value={2}>{tWidgets('size_tall')}</option>
                </select>
             </div>
          </div>
        </div>

        {/* Specific Config */}
        <div className="pt-4 border-t border-gray-100">
           <h4 className="text-sm font-medium text-gray-900 mb-3">{tWidgets('configuration')}</h4>
           {renderConfigFields()}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30"
          >
            {tWidgets('save_changes')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
