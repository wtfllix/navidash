/**
 * Bookmark Interface
 * 定义书签节点结构，支持无限层级嵌套
 */
export interface Bookmark {
  id: string;       // 唯一标识符
  title: string;    // 显示标题
  url?: string;     // 链接地址（文件夹节点可为空）
  icon?: string;    // 图标名称（对应 Lucide 图标库）
  color?: string;   // 自定义颜色（可选）
  children?: Bookmark[]; // 子节点列表（实现树形结构）
}

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
  | 'date'
  | 'most-visited';

// ─── per-Widget config 接口 ───────────────────────────────────────────────────

export interface ClockWidgetConfig {
  clockStyle?: 'digital' | 'analog' | 'flip' | 'apple';
}

export interface WeatherWidgetConfig {
  apiKey?: string;
  city?: string;
  lat?: number;
  lon?: number;
  weatherSub?: string;         // 订阅级别，如 'free' | 'standard' 等
  weatherCustomHost?: string;
  weatherAuthType?: 'param' | 'bearer';
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
  imageUrl?: string;
}

// ── Links Collection ──
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
  bgColor?: string;    // Tailwind 背景色类名，如 'bg-yellow-200'
  textColor?: string;  // Tailwind 文字色类名，如 'text-yellow-900'
}

export interface TodoWidgetConfig {
  todos?: Array<{ id: string; text: string; completed: boolean }>;
}

/**
 * WidgetConfig
 * 所有 Widget config 字段的 Partial 交集。
 * 保证：已知字段有类型约束，未知字段不允许随意赋值。
 * 访问任意字段（如 config.apiKey）无需类型转换，且 IDE 有自动补全。
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
 * Widget Interface
 * 定义桌面小组件结构
 */
export interface Widget {
  id: string;                        // 唯一标识符
  type: WidgetType;                  // 组件类型
  size: { w: number; h: number };    // 组件尺寸（Grid Layout 单位）
  position: { x: number; y: number }; // 组件位置（Grid Layout 坐标）
  config: WidgetConfig;              // 组件专属配置
}

// ─── Settings 接口 ────────────────────────────────────────────────────────────

/**
 * Settings
 * 与 useSettingsStore 中的数据字段保持同步
 */
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
