'use client';

import LinksConfigEditor from './LinksConfigEditor';
import PhotoFrameConfigEditor from './PhotoFrameConfigEditor';
import TodayConfigEditor from './TodayConfigEditor';
import F1ConfigEditor from './F1ConfigEditor';
import KomariConfigEditor from './KomariConfigEditor';
import { EditableWidgetType, WidgetConfigEditorComponent } from './types';

export const widgetConfigEditors: {
  [K in EditableWidgetType]: WidgetConfigEditorComponent<K>;
} = {
  today: TodayConfigEditor,
  'photo-frame': PhotoFrameConfigEditor,
  links: LinksConfigEditor,
  f1: F1ConfigEditor,
  komari: KomariConfigEditor,
};
