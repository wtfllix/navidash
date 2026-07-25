import { Settings, Widget } from '@/types';

export const DEMO_DATA_VERSION = 1;

export const isClientDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const isServerDemoMode =
  process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const DEMO_WIDGETS: Widget[] = [
  {
    id: 'demo-today',
    type: 'today',
    size: { w: 2, h: 2 },
    position: { x: 0, y: 0 },
    config: {
      city: 'Hangzhou',
      lat: 30.2741,
      lon: 120.1551,
    },
  },
  {
    id: 'demo-links',
    type: 'links',
    size: { w: 3, h: 1 },
    position: { x: 2, y: 0 },
    config: {
      title: 'Daily Flow',
      showLabels: true,
      iconSize: 'md',
      links: [
        { id: 'figma', title: 'Figma', url: 'https://figma.com' },
        { id: 'github', title: 'GitHub', url: 'https://github.com' },
        { id: 'linear', title: 'Linear', url: 'https://linear.app' },
        { id: 'vercel', title: 'Vercel', url: 'https://vercel.com' },
        { id: 'notion', title: 'Notion', url: 'https://notion.so' },
        { id: 'openai', title: 'OpenAI', url: 'https://openai.com' },
      ],
    },
  },
  {
    id: 'demo-inbox',
    type: 'links',
    size: { w: 1, h: 1 },
    position: { x: 5, y: 0 },
    config: {
      links: [{ id: 'inbox', title: 'Inbox', url: 'https://mail.google.com/' }],
      showLabels: true,
      iconSize: 'lg',
    },
  },
  {
    id: 'demo-memo',
    type: 'memo',
    size: { w: 2, h: 1 },
    position: { x: 2, y: 1 },
    config: {
      content: 'Ship the focused homepage.\nKeep links practical and the wall personal.',
      bgColor: '#fef08a',
      textColor: '#713f12',
    },
  },
  {
    id: 'demo-photo',
    type: 'photo-frame',
    size: { w: 2, h: 2 },
    position: { x: 6, y: 0 },
    config: {
      images: [
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      ],
      autoplay: false,
      interval: 5000,
      shuffle: false,
    },
  },
];

export const DEMO_SETTINGS: Settings = {
  backgroundImage:
    'radial-gradient(circle at top left, rgba(15,118,110,0.12), transparent 34%), radial-gradient(circle at bottom right, rgba(245,158,11,0.14), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
  backgroundBlur: 0,
  backgroundOpacity: 0,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  customFavicon: '/favicon.svg',
  customTitle: 'NaviDash Demo',
  language: 'en',
};

export function getDemoWeather(city = 'Hangzhou') {
  return {
    current: {
      obsTime: new Date('2026-04-08T09:30:00.000Z').toISOString(),
      temp: '22',
      feelsLike: '24',
      icon: '101',
      text: city === 'Hangzhou' ? 'Cloudy' : 'Partly cloudy',
      windScale: '2',
      humidity: '61',
      cloud: '42',
    },
  };
}
