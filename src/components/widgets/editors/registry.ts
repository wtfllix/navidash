'use client';

import LinksConfigEditor from './LinksConfigEditor';
import PhotoFrameConfigEditor from './PhotoFrameConfigEditor';
import TodayConfigEditor from './TodayConfigEditor';
import { EditableWidgetType, WidgetConfigEditorComponent } from './types';

export const widgetConfigEditors: {
  [K in EditableWidgetType]: WidgetConfigEditorComponent<K>;
} = {
  today: TodayConfigEditor,
  'photo-frame': PhotoFrameConfigEditor,
  links: LinksConfigEditor,
};
