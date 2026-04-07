'use client';

import { WidgetConfig, WidgetSize, WidgetType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const PRESET_CITIES = [
  { name: 'Beijing', lat: 39.9042, lon: 116.4074 },
  { name: 'Shanghai', lat: 31.2304, lon: 121.4737 },
  { name: 'Guangzhou', lat: 23.1291, lon: 113.2644 },
  { name: 'Shenzhen', lat: 22.5431, lon: 114.0579 },
  { name: 'Chengdu', lat: 30.5728, lon: 104.0668 },
  { name: 'Hangzhou', lat: 30.2741, lon: 120.1551 },
  { name: 'Wuhan', lat: 30.5928, lon: 114.3055 },
  { name: "Xi'an", lat: 34.3416, lon: 108.9398 },
  { name: 'Chongqing', lat: 29.563, lon: 106.5516 },
  { name: 'Nanjing', lat: 32.0603, lon: 118.7969 },
  { name: 'Tianjin', lat: 39.0842, lon: 117.2009 },
  { name: 'Suzhou', lat: 31.2989, lon: 120.5853 },
  { name: 'Ningbo', lat: 29.8683, lon: 121.544 },
  { name: 'Wuxi', lat: 31.4912, lon: 120.3119 },
  { name: 'Qingdao', lat: 36.0671, lon: 120.3826 },
  { name: 'Jinan', lat: 36.6512, lon: 117.12 },
  { name: 'Zhengzhou', lat: 34.7473, lon: 113.6249 },
  { name: 'Changsha', lat: 28.2282, lon: 112.9388 },
  { name: 'Fuzhou', lat: 26.0745, lon: 119.2965 },
  { name: 'Xiamen', lat: 24.4798, lon: 118.0894 },
  { name: 'Hefei', lat: 31.8206, lon: 117.229 },
  { name: 'Nanchang', lat: 28.6829, lon: 115.8582 },
  { name: 'Shenyang', lat: 41.8057, lon: 123.4315 },
  { name: 'Dalian', lat: 38.914, lon: 121.6147 },
  { name: 'Harbin', lat: 45.8038, lon: 126.5349 },
  { name: 'Shijiazhuang', lat: 38.0428, lon: 114.5149 },
  { name: 'Taiyuan', lat: 37.87, lon: 112.5489 },
  { name: 'Kunming', lat: 24.8801, lon: 102.8329 },
  { name: 'Guiyang', lat: 26.647, lon: 106.63 },
  { name: 'Nanning', lat: 22.817, lon: 108.3669 },
  { name: 'Haikou', lat: 20.044, lon: 110.1999 },
  { name: 'Sanya', lat: 18.2528, lon: 109.512 },
  { name: 'Lanzhou', lat: 36.0611, lon: 103.8343 },
  { name: 'Urumqi', lat: 43.8256, lon: 87.6168 },
  { name: 'Hohhot', lat: 40.8426, lon: 111.7492 },
  { name: 'Zhuhai', lat: 22.271, lon: 113.5767 },
  { name: 'Foshan', lat: 23.0215, lon: 113.1214 },
  { name: 'Dongguan', lat: 23.0207, lon: 113.7518 },
  { name: 'Hong Kong', lat: 22.3193, lon: 114.1694 },
  { name: 'Taipei', lat: 25.033, lon: 121.5654 },
  { name: 'Macau', lat: 22.1987, lon: 113.5439 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Osaka', lat: 34.6937, lon: 135.5023 },
  { name: 'Seoul', lat: 37.5665, lon: 126.978 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
  { name: 'Vancouver', lat: 49.2827, lon: -123.1207 },
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Berlin', lat: 52.52, lon: 13.405 },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
  { name: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { name: 'Rome', lat: 41.9028, lon: 12.4964 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Melbourne', lat: -37.8136, lon: 144.9631 },
] as const;

export const COLOR_OPTIONS = [
  { color: '#ef4444', label: 'Red' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#22c55e', label: 'Green' },
  { color: '#f97316', label: 'Orange' },
  { color: '#a855f7', label: 'Purple' },
  { color: '#1f2937', label: 'Black' },
] as const;

export const SIZE_PRESETS = {
  s11: { w: 1, h: 1, labelKey: 'size_preset_1x1' },
  s21: { w: 2, h: 1, labelKey: 'size_preset_2x1' },
  s12: { w: 1, h: 2, labelKey: 'size_preset_1x2' },
  s22: { w: 2, h: 2, labelKey: 'size_preset_2x2' },
  s23: { w: 2, h: 3, labelKey: 'size_preset_2x3' },
  s31: { w: 3, h: 1, labelKey: 'size_preset_3x1' },
  s32: { w: 3, h: 2, labelKey: 'size_preset_3x2' },
} as const;

type SizePresetKey = keyof typeof SIZE_PRESETS;

export const WIDGET_SIZE_PRESET_MAP: Record<WidgetType, SizePresetKey[]> = {
  clock: ['s11', 's21'],
  weather: ['s11', 's21', 's22'],
  date: ['s11', 's21'],
  'quick-link': ['s11'],
  links: ['s21', 's22', 's31'],
  todo: ['s22', 's23'],
  memo: ['s22', 's23'],
  calendar: ['s21', 's22'],
  'photo-frame': ['s12', 's22', 's32'],
  rss: ['s31', 's32'],
  monitor: ['s31', 's32'],
};

export function getAllowedSizePresets(widgetType: WidgetType) {
  return WIDGET_SIZE_PRESET_MAP[widgetType].map((key) => ({
    key,
    ...SIZE_PRESETS[key],
  }));
}

export function getSizePresetKey(size: WidgetSize): SizePresetKey | null {
  const entry = Object.entries(SIZE_PRESETS).find(
    ([, preset]) => preset.w === size.w && preset.h === size.h
  );
  return (entry?.[0] as SizePresetKey | undefined) ?? null;
}

export function getDefaultAllowedSize(widgetType: WidgetType): WidgetSize {
  const preset = getAllowedSizePresets(widgetType)[0];
  return { w: preset.w, h: preset.h };
}

export function normalizeWeatherConfig(config: WidgetConfig): WidgetConfig {
  if (!config.city) return config;
  const matchedCity = PRESET_CITIES.find(
    (city) => city.name.toLowerCase() === config.city?.toLowerCase()
  );
  if (!matchedCity) return config;

  return {
    ...config,
    city: matchedCity.name,
    lat: matchedCity.lat,
    lon: matchedCity.lon,
  };
}

export function getLinkDomain(url: string) {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

export function trimToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function createLinkItem(input: string) {
  const line = input.trim();
  if (!line) return null;

  const pipeIdx = line.indexOf('|');
  if (pipeIdx > -1) {
    const title = line.slice(0, pipeIdx).trim();
    const url = line.slice(pipeIdx + 1).trim();
    if (!url) return null;
    return { id: uuidv4(), title: title || getLinkDomain(url), url };
  }

  return { id: uuidv4(), title: getLinkDomain(line), url: line };
}
