'use client';

import { ComponentType } from 'react';
import { WidgetConfigByType, WidgetSize } from '@/types';

export type EditableWidgetType =
  | 'today'
  | 'photo-frame'
  | 'links';

export type ConfigUpdate<T> = T | ((prev: T) => T);

export interface WidgetConfigEditorProps<T extends EditableWidgetType = EditableWidgetType> {
  config: WidgetConfigByType<T>;
  setConfig: (update: ConfigUpdate<WidgetConfigByType<T>>) => void;
  size?: WidgetSize;
}

export type WidgetConfigEditorComponent<T extends EditableWidgetType> = ComponentType<
  WidgetConfigEditorProps<T>
>;
