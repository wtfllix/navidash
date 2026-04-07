'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { WeatherWidgetConfig } from '@/types';
import { useTranslations } from 'next-intl';
import { FormField, SelectInput, TextInput } from './FormControls';
import { parseOptionalNumber, PRESET_CITIES, trimToUndefined } from './shared';
import { WidgetConfigEditorProps } from './types';

export default function WeatherConfigEditor({ config, setConfig }: WidgetConfigEditorProps<'weather'>) {
  const t = useTranslations('Widgets');
  const [citySearch, setCitySearch] = useState(config.city || '');
  const [showCityList, setShowCityList] = useState(false);

  useEffect(() => {
    if (!showCityList) {
      setCitySearch(config.city || '');
    }
  }, [config.city, showCityList]);

  const filteredCities = useMemo(
    () =>
      PRESET_CITIES.filter((city) => city.name.toLowerCase().includes(citySearch.toLowerCase())).slice(0, 12),
    [citySearch]
  );

  const selectCity = (city: (typeof PRESET_CITIES)[number]) => {
    setConfig((current) => ({
      ...current,
      city: city.name,
      lat: city.lat,
      lon: city.lon,
    }));
    setCitySearch(city.name);
    setShowCityList(false);
  };

  return (
    <div className="space-y-4">
      <FormField
        label={t('api_key')}
        hint={t.rich('api_requirement', {
          link: (chunks: React.ReactNode) => (
            <a
              href="https://console.qweather.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {chunks}
            </a>
          ),
        })}
      >
        <TextInput
          type="text"
          value={config.apiKey || ''}
          onChange={(e) => setConfig((current) => ({ ...current, apiKey: e.target.value }))}
          onBlur={(e) => setConfig((current) => ({ ...current, apiKey: trimToUndefined(e.target.value) }))}
          placeholder={t('api_key_placeholder')}
          aria-label={t('api_key')}
        />
      </FormField>

      <FormField label={t('sub_custom')}>
        <TextInput
          type="text"
          value={config.weatherCustomHost || ''}
          onChange={(e) => setConfig((current) => ({ ...current, weatherCustomHost: e.target.value }))}
          onBlur={(e) =>
            setConfig((current) => ({ ...current, weatherCustomHost: trimToUndefined(e.target.value) }))
          }
          placeholder={t('custom_host_placeholder')}
        />
      </FormField>

      <FormField label={t('auth_type')}>
        <SelectInput
          value={config.weatherAuthType || 'param'}
          onChange={(e) =>
            setConfig((current) => ({
              ...current,
              weatherAuthType: e.target.value as WeatherWidgetConfig['weatherAuthType'],
            }))
          }
        >
          <option value="param">{t('auth_param')}</option>
          <option value="bearer">{t('auth_bearer')}</option>
        </SelectInput>
      </FormField>

      <FormField label={t('city_name')} hint={t('weather_city_hint')}>
        <div className="relative">
          <TextInput
            type="text"
            value={showCityList ? citySearch : config.city || citySearch}
            onChange={(e) => {
              const nextValue = e.target.value;
              setCitySearch(nextValue);
              setShowCityList(true);
              setConfig((current) => ({ ...current, city: nextValue }));
            }}
            onFocus={() => {
              setCitySearch(config.city || '');
              setShowCityList(true);
            }}
            onBlur={() => {
              window.setTimeout(() => {
                setShowCityList(false);
                setConfig((current) => ({ ...current, city: trimToUndefined(citySearch) }));
              }, 150);
            }}
            placeholder={t('quick_select_city') || 'Search City...'}
            autoComplete="off"
          />

          {showCityList ? (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectCity(city)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 transition-colors"
                  >
                    <span className="font-medium">{city.name}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">{t('no_city_matches')}</div>
              )}
            </div>
          ) : null}
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('latitude')}>
          <TextInput
            type="number"
            value={config.lat ?? ''}
            onChange={(e) => setConfig((current) => ({ ...current, lat: parseOptionalNumber(e.target.value) }))}
            aria-label={t('latitude')}
          />
        </FormField>
        <FormField label={t('longitude')}>
          <TextInput
            type="number"
            value={config.lon ?? ''}
            onChange={(e) => setConfig((current) => ({ ...current, lon: parseOptionalNumber(e.target.value) }))}
            aria-label={t('longitude')}
          />
        </FormField>
      </div>

      <p className="text-xs text-gray-500">
        {t('find_coords')}{' '}
        <a href="https://www.latlong.net/" target="_blank" rel="noreferrer" className="text-blue-500 underline">
          latlong.net
        </a>
      </p>
    </div>
  );
}
