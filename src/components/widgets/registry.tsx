/**
 * Widget Registry
 *
 * 统一管理所有 Widget 的：
 *  1. 渲染组件（供 MainCanvas 使用）
 *  2. 选择器元数据（供 WidgetPicker 使用）
 *
 * 新增 Widget 类型时，只需在此文件添加一条记录，
 * 无需修改 MainCanvas 或 WidgetPicker。
 */

import React from 'react';
import {
  Clock,
  CloudSun,
  Link as LinkIcon,
  LayoutGrid,
  Calendar,
  CheckSquare,
  Image as ImageIcon,
  CalendarDays,
  StickyNote,
  BarChart,
  type LucideIcon,
} from 'lucide-react';
import { Widget, WidgetType } from '@/types';

import ClockWidget from './ClockWidget';
import LinksWidget from './LinksWidget';
import WeatherWidget from './WeatherWidget';
import DateWidget from './DateWidget';
import QuickLinkWidget from './QuickLinkWidget';
import TodoWidget from './TodoWidget';
import MemoWidget from './MemoWidget';
import CalendarWidget from './CalendarWidget';
import PhotoWidget from './PhotoWidget';

// ─── 渲染组件映射 ─────────────────────────────────────────────────────────────

/**
 * 组件注册表。
 * undefined 表示该类型尚未实现，渲染时显示 "Coming Soon"。
 */
type WidgetRenderer = React.ComponentType<{ widget: Widget }>;

export const widgetComponentRegistry: Partial<Record<WidgetType, WidgetRenderer>> = {
  clock: ClockWidget as WidgetRenderer,
  weather: WeatherWidget as WidgetRenderer,
  date: DateWidget as WidgetRenderer,
  'quick-link': QuickLinkWidget as WidgetRenderer,
  links: LinksWidget as WidgetRenderer,
  todo: TodoWidget as WidgetRenderer,
  memo: MemoWidget as WidgetRenderer,
  calendar: CalendarWidget as WidgetRenderer,
  'photo-frame': PhotoWidget as WidgetRenderer,
  // rss、monitor 尚未实现，不注册
};

// ─── WidgetPicker 元数据 ───────────────────────────────────────────────────────

export type WidgetCategory = 'system' | 'productivity' | 'custom';

export interface WidgetMeta {
  type: WidgetType;
  /** next-intl 翻译 key（对应 Widgets 命名空间） */
  titleKey: string;
  descKey: string;
  /** Lucide 图标组件 */
  Icon: LucideIcon;
  iconClassName: string;
  defaultSize: { w: number; h: number };
  category: WidgetCategory;
}

export const widgetMeta: WidgetMeta[] = [
  // ── System ──
  {
    type: 'clock',
    titleKey: 'clock',
    descKey: 'clock_desc',
    Icon: Clock,
    iconClassName: 'text-blue-600',
    defaultSize: { w: 2, h: 1 },
    category: 'system',
  },
  {
    type: 'weather',
    titleKey: 'weather',
    descKey: 'weather_desc',
    Icon: CloudSun,
    iconClassName: 'text-orange-500',
    defaultSize: { w: 2, h: 1 },
    category: 'system',
  },
  {
    type: 'date',
    titleKey: 'date',
    descKey: 'date_desc',
    Icon: CalendarDays,
    iconClassName: 'text-red-500',
    defaultSize: { w: 1, h: 1 },
    category: 'system',
  },
  // ── Productivity ──
  {
    type: 'calendar',
    titleKey: 'calendar',
    descKey: 'calendar_desc',
    Icon: Calendar,
    iconClassName: 'text-purple-500',
    defaultSize: { w: 2, h: 1 },
    category: 'productivity',
  },
  {
    type: 'todo',
    titleKey: 'todo',
    descKey: 'todo_desc',
    Icon: CheckSquare,
    iconClassName: 'text-indigo-500',
    defaultSize: { w: 2, h: 2 },
    category: 'productivity',
  },
  {
    type: 'memo',
    titleKey: 'memo',
    descKey: 'memo_desc',
    Icon: StickyNote,
    iconClassName: 'text-yellow-500',
    defaultSize: { w: 2, h: 2 },
    category: 'productivity',
  },
  // ── Custom ──
  {
    type: 'links',
    titleKey: 'links',
    descKey: 'links_desc',
    Icon: LayoutGrid,
    iconClassName: 'text-violet-500',
    defaultSize: { w: 2, h: 1 },
    category: 'custom',
  },
  {
    type: 'quick-link',
    titleKey: 'quick_link',
    descKey: 'quick_link_desc',
    Icon: LinkIcon,
    iconClassName: 'text-green-500',
    defaultSize: { w: 1, h: 1 },
    category: 'custom',
  },
  {
    type: 'photo-frame',
    titleKey: 'photo_frame',
    descKey: 'photo_frame_desc',
    Icon: ImageIcon,
    iconClassName: 'text-pink-500',
    defaultSize: { w: 2, h: 2 },
    category: 'custom',
  },
];

/** 所有可用分类 key */
export const widgetCategories: WidgetCategory[] = ['system', 'productivity', 'custom'];

export const widgetTypesRequiringSetup: WidgetType[] = [
  'quick-link',
  'photo-frame',
  'links',
];
