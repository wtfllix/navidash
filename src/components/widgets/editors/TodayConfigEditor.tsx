'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormField, TextInput } from './FormControls';
import { parseOptionalNumber, PRESET_CITIES, trimToUndefined } from './shared';
import { WidgetConfigEditorProps } from './types';

export default function TodayConfigEditor({
  config,
  setConfig,
}: WidgetConfigEditorProps<'today'>) {
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
      PRESET_CITIES.filter((city) =>
        city.name.toLowerCase().includes(citySearch.toLowerCase())
      ).slice(0, 12),
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
      <FormField label={t('city_name')} hint={t('weather_city_hint')}>
        <div className="relative">
          <TextInput
            type="text"
            value={showCityList ? citySearch : config.city || citySearch}
            onChange={(event) => {
              const nextValue = event.target.value;
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
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectCity(city)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-blue-50"
                  >
                    <span className="font-medium">{city.name}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-sm text-gray-500">
                  {t('no_city_matches')}
                </div>
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
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                lat: parseOptionalNumber(event.target.value),
              }))
            }
            aria-label={t('latitude')}
          />
        </FormField>
        <FormField label={t('longitude')}>
          <TextInput
            type="number"
            value={config.lon ?? ''}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                lon: parseOptionalNumber(event.target.value),
              }))
            }
            aria-label={t('longitude')}
          />
        </FormField>
      </div>

      <p className="text-xs text-gray-500">
        {t('find_coords')}{' '}
        <a
          href="https://www.latlong.net/"
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 underline"
        >
          latlong.net
        </a>
      </p>
      <p className="text-xs leading-5 text-amber-700">{t('weather_api_config_hint')}</p>
    </div>
  );
}
