import { WidgetConfigEntry, WidgetLayoutsByMode } from '@/types';

export interface HomepageTemplate {
  id: 'blank' | 'focus' | 'wall';
  titleKey: string;
  descriptionKey: string;
  layoutsByMode: WidgetLayoutsByMode;
  configs: WidgetConfigEntry[];
}

export const HOMEPAGE_TEMPLATES: HomepageTemplate[] = [
  {
    id: 'blank',
    titleKey: 'template_blank',
    descriptionKey: 'template_blank_desc',
    layoutsByMode: { desktop: [], mobile: [] },
    configs: [],
  },
  {
    id: 'focus',
    titleKey: 'template_focus',
    descriptionKey: 'template_focus_desc',
    layoutsByMode: {
      desktop: [
        {
          id: 'template-focus-today',
          type: 'today',
          size: { w: 2, h: 2 },
          position: { x: 0, y: 0 },
        },
        {
          id: 'template-focus-links',
          type: 'links',
          size: { w: 3, h: 1 },
          position: { x: 2, y: 0 },
        },
      ],
      mobile: [
        {
          id: 'template-focus-today',
          type: 'today',
          size: { w: 2, h: 2 },
          position: { x: 0, y: 0 },
        },
        {
          id: 'template-focus-links',
          type: 'links',
          size: { w: 2, h: 1 },
          position: { x: 0, y: 2 },
        },
      ],
    },
    configs: [
      {
        id: 'template-focus-today',
        type: 'today',
        config: {},
      },
      {
        id: 'template-focus-links',
        type: 'links',
        config: {
          title: 'Start here',
          showLabels: true,
          bookmarkIds: [],
        },
      },
    ],
  },
  {
    id: 'wall',
    titleKey: 'template_wall',
    descriptionKey: 'template_wall_desc',
    layoutsByMode: {
      desktop: [
        {
          id: 'template-wall-today',
          type: 'today',
          size: { w: 2, h: 2 },
          position: { x: 0, y: 0 },
        },
        {
          id: 'template-wall-links',
          type: 'links',
          size: { w: 3, h: 1 },
          position: { x: 2, y: 0 },
        },
        {
          id: 'template-wall-memo',
          type: 'memo',
          size: { w: 2, h: 1 },
          position: { x: 2, y: 1 },
        },
        {
          id: 'template-wall-poster',
          type: 'photo-frame',
          size: { w: 2, h: 2 },
          position: { x: 5, y: 0 },
        },
      ],
      mobile: [
        {
          id: 'template-wall-today',
          type: 'today',
          size: { w: 2, h: 2 },
          position: { x: 0, y: 0 },
        },
        {
          id: 'template-wall-links',
          type: 'links',
          size: { w: 2, h: 1 },
          position: { x: 0, y: 2 },
        },
        {
          id: 'template-wall-memo',
          type: 'memo',
          size: { w: 2, h: 1 },
          position: { x: 0, y: 3 },
        },
        {
          id: 'template-wall-poster',
          type: 'photo-frame',
          size: { w: 2, h: 2 },
          position: { x: 0, y: 4 },
        },
      ],
    },
    configs: [
      { id: 'template-wall-today', type: 'today', config: {} },
      {
        id: 'template-wall-links',
        type: 'links',
        config: {
          title: 'Frequent links',
          showLabels: true,
          bookmarkIds: [],
        },
      },
      {
        id: 'template-wall-memo',
        type: 'memo',
        config: { content: '' },
      },
      {
        id: 'template-wall-poster',
        type: 'photo-frame',
        config: { images: [], autoplay: false },
      },
    ],
  },
];
