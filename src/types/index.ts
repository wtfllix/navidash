
// ─── Widget 类型 ──────────────────────────────────────────────────────────────

export type WidgetType =
  | 'weather'
  | 'clock'
  | 'rss'
  | 'monitor'
  | 'quick-link'
  | 'links'
  | 'calendar'
  | 'memo'
  | 'todo'
  | 'photo-frame'
  | 'date';

export interface WidgetSize {
  w: number;
  h: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

// ─── per-Widget config 接口 ───────────────────────────────────────────────────

export interface ClockWidgetConfig {
  clockStyle?: 'glass' | 'minimal' | 'bento' | 'digital' | 'analog' | 'flip' | 'apple';
}

export interface WeatherWidgetConfig {
  city?: string;
  lat?: number;
  lon?: number;
  weatherSub?: string;
  weatherCustomHost?: string;
  weatherAuthType?: 'apikey' | 'jwt';
}

export interface DateWidgetConfig {
  style?: 'classic' | 'minimal' | 'glass' | 'bauhaus';
  color?: string;
}

export interface QuickLinkWidgetConfig {
  title?: string;
  url?: string;
}

export interface PhotoWidgetConfig {
  images?: string[];
  imageUrl?: string;
  autoplay?: boolean;
  interval?: number;
  shuffle?: boolean;
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
}

export interface LinksWidgetConfig {
  title?: string;
  links?: LinkItem[];
  showLabels?: boolean;
  iconSize?: 'sm' | 'md' | 'lg';
}

export interface MemoWidgetConfig {
  content?: string;
  bgColor?: string;
  textColor?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoWidgetConfig {
  todos?: TodoItem[];
}

export type EmptyWidgetConfig = Record<string, never>;

/**
 * WidgetConfig
 * 用于编辑表单和通用更新场景的宽松配置类型。
 */
export type WidgetConfig =
  Partial<ClockWidgetConfig> &
  Partial<WeatherWidgetConfig> &
  Partial<DateWidgetConfig> &
  Partial<QuickLinkWidgetConfig> &
  Partial<PhotoWidgetConfig> &
  Partial<MemoWidgetConfig> &
  Partial<TodoWidgetConfig> &
  Partial<LinksWidgetConfig>;

/**
 * WidgetConfigMap
 * 每种 widget type 对应其唯一 config 结构。
 */
export interface WidgetConfigMap {
  weather: WeatherWidgetConfig;
  clock: ClockWidgetConfig;
  rss: EmptyWidgetConfig;
  monitor: EmptyWidgetConfig;
  'quick-link': QuickLinkWidgetConfig;
  links: LinksWidgetConfig;
  calendar: EmptyWidgetConfig;
  memo: MemoWidgetConfig;
  todo: TodoWidgetConfig;
  'photo-frame': PhotoWidgetConfig;
  date: DateWidgetConfig;
}

export type WidgetConfigByType<T extends WidgetType> = WidgetConfigMap[T];

interface BaseWidget<T extends WidgetType> {
  id: string;
  type: T;
  size: WidgetSize;
  position: WidgetPosition;
  config: WidgetConfigByType<T>;
}

/**
 * Widget
 * 通过 discriminated union 将 type 与 config 绑定。
 */
export type Widget = {
  [T in WidgetType]: BaseWidget<T>;
}[WidgetType];

export type WidgetOfType<T extends WidgetType> = Extract<Widget, { type: T }>;

export type WidgetLayout = Omit<Widget, 'config'>;

export type WidgetConfigEntry = {
  [T in WidgetType]: {
    id: string;
    type: T;
    config: WidgetConfigByType<T>;
  };
}[WidgetType];

// ─── Settings 接口 ────────────────────────────────────────────────────────────

export interface Settings {
  backgroundImage: string;
  backgroundBlur: number;
  backgroundOpacity: number;
  backgroundSize: string;
  backgroundRepeat: string;
  themeColor: string;
  customFavicon: string;
  customTitle: string;
  language: string;
}

export const DEFAULT_SETTINGS: Settings = {
  backgroundImage: 'radial-gradient(#d1d5db 2px, transparent 2px)',
  backgroundBlur: 0,
  backgroundOpacity: 0,
  backgroundSize: '24px 24px',
  backgroundRepeat: 'repeat',
  themeColor: '#3b82f6',
  customFavicon: '/favicon.svg',
  customTitle: 'Navidash',
  language: 'en',
};
