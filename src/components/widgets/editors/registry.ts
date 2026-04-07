'use client';

import ClockConfigEditor from './ClockConfigEditor';
import DateConfigEditor from './DateConfigEditor';
import LinksConfigEditor from './LinksConfigEditor';
import PhotoFrameConfigEditor from './PhotoFrameConfigEditor';
import QuickLinkConfigEditor from './QuickLinkConfigEditor';
import WeatherConfigEditor from './WeatherConfigEditor';
import { EditableWidgetType, WidgetConfigEditorComponent } from './types';

export const widgetConfigEditors: {
  [K in EditableWidgetType]: WidgetConfigEditorComponent<K>;
} = {
  clock: ClockConfigEditor,
  date: DateConfigEditor,
  weather: WeatherConfigEditor,
  'quick-link': QuickLinkConfigEditor,
  'photo-frame': PhotoFrameConfigEditor,
  links: LinksConfigEditor,
};
