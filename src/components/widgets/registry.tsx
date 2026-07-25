/**
 * Widget Registry
 *
 * 统一管理所有 Widget 的：
 *  1. 渲染组件（供 MainCanvas 使用）
 *  2. 组件库元数据（供 WidgetStoreSidebar 使用）
 *
 * 新增 Widget 类型时，只需在此文件添加一条记录，
 * 无需修改 MainCanvas 或组件库实现。
 */

import React from 'react';
import {
  LayoutGrid,
  Image as ImageIcon,
  StickyNote,
  PanelTop,
  type LucideIcon,
} from 'lucide-react';
import { Widget, WidgetType } from '@/types';

import LinksWidget from './LinksWidget';
import MemoWidget from './MemoWidget';
import PhotoWidget from './PhotoWidget';
import TodayWidget from './TodayWidget';

// ─── 渲染组件映射 ─────────────────────────────────────────────────────────────

/**
 * 当前组件的统一注册表。
 */
type WidgetRenderer = React.ComponentType<{ widget: Widget }>;

export const widgetComponentRegistry: Partial<Record<WidgetType, WidgetRenderer>> = {
  today: TodayWidget as WidgetRenderer,
  links: LinksWidget as WidgetRenderer,
  memo: MemoWidget as WidgetRenderer,
  'photo-frame': PhotoWidget as WidgetRenderer,
};

// ─── 组件库元数据 ──────────────────────────────────────────────────────────────

export interface WidgetMeta {
  type: WidgetType;
  /** next-intl 翻译 key（对应 Widgets 命名空间） */
  titleKey: string;
  descKey: string;
  /** Lucide 图标组件 */
  Icon: LucideIcon;
  iconClassName: string;
  defaultSize: { w: number; h: number };
}

export const widgetMeta: WidgetMeta[] = [
  {
    type: 'links',
    titleKey: 'links',
    descKey: 'links_desc',
    Icon: LayoutGrid,
    iconClassName: 'text-violet-500',
    defaultSize: { w: 2, h: 1 },
  },
  {
    type: 'today',
    titleKey: 'today',
    descKey: 'today_desc',
    Icon: PanelTop,
    iconClassName: 'text-sky-600',
    defaultSize: { w: 2, h: 2 },
  },
  {
    type: 'memo',
    titleKey: 'memo',
    descKey: 'memo_desc',
    Icon: StickyNote,
    iconClassName: 'text-amber-500',
    defaultSize: { w: 2, h: 1 },
  },
  {
    type: 'photo-frame',
    titleKey: 'photo_frame',
    descKey: 'photo_frame_desc',
    Icon: ImageIcon,
    iconClassName: 'text-pink-500',
    defaultSize: { w: 2, h: 2 },
  },
];

export const widgetTypesRequiringSetup: WidgetType[] = [
  'today',
  'photo-frame',
  'links',
];
