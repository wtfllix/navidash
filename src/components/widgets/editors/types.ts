'use client';

import { ComponentType } from 'react';
import { WidgetConfigByType, WidgetSize } from '@/types';

export type EditableWidgetType =
  | 'clock'
  | 'date'
  | 'weather'
  | 'quick-link'
  | 'photo-frame'
  | 'links';

export type ConfigUpdate<T> = T | ((prev: T) => T);

export interface WidgetConfigEditorProps<T extends EditableWidgetType = EditableWidgetType> {
  config: WidgetConfigByType<T>;
  setConfig: (update: ConfigUpdate<WidgetConfigByType<T>>) => void;
}

export interface WidgetConfigEditorWithSizeProps<T extends EditableWidgetType = EditableWidgetType>
  extends WidgetConfigEditorProps<T> {
  setSize: (size: WidgetSize) => void;
}

export type WidgetConfigEditorComponent<T extends EditableWidgetType> = ComponentType<
  T extends 'clock' ? WidgetConfigEditorWithSizeProps<T> : WidgetConfigEditorProps<T>
>;
