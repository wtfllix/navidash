import { mergeWidgets } from '@/lib/schemas';
import { Settings, Widget, WidgetSnapshot } from '@/types';

export const DEMO_DATA_VERSION = 3;

export const DEMO_KOMARI_NODE_ID = '00000000-0000-4000-8000-000000000001';

export const isClientDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const isServerDemoMode =
  process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const DEMO_WIDGET_SNAPSHOT: WidgetSnapshot = {
  schemaVersion: 2,
  revision: DEMO_DATA_VERSION,
  bookmarks: [
    { id: 'demo-github', title: 'GitHub', url: 'https://github.com/' },
    { id: 'demo-chatgpt', title: 'ChatGPT', url: 'https://chatgpt.com/' },
    { id: 'demo-youtube', title: 'YouTube', url: 'https://youtube.com/' },
    { id: 'demo-gmail', title: 'Gmail', url: 'https://mail.google.com/' },
    { id: 'demo-figma', title: 'Figma', url: 'https://figma.com/' },
    { id: 'demo-notion', title: 'Notion', url: 'https://notion.so/' },
    { id: 'demo-linear', title: 'Linear', url: 'https://linear.app/' },
    { id: 'demo-vercel', title: 'Vercel', url: 'https://vercel.com/' },
    { id: 'demo-spotify', title: 'Spotify', url: 'https://open.spotify.com/' },
    { id: 'demo-bilibili', title: 'Bilibili', url: 'https://bilibili.com/' },
    { id: 'demo-reddit', title: 'Reddit', url: 'https://reddit.com/' },
    { id: 'demo-medium', title: 'Medium', url: 'https://medium.com/' },
  ],
  configs: [
    {
      id: 'demo-today',
      type: 'today',
      config: {
        city: 'Shenzhen',
        lat: 22.5431,
        lon: 114.0579,
      },
    },
    {
      id: 'demo-daily-links',
      type: 'links',
      config: {
        title: 'Daily Flow',
        bookmarkIds: [
          'demo-github',
          'demo-chatgpt',
          'demo-youtube',
          'demo-gmail',
          'demo-figma',
        ],
        showLabels: true,
        iconSize: 'lg',
      },
    },
    {
      id: 'demo-poster',
      type: 'photo-frame',
      config: {
        images: [
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        ],
        autoplay: false,
        interval: 5000,
        shuffle: false,
      },
    },
    {
      id: 'demo-memo',
      type: 'memo',
      config: {
        content: 'Keep the homepage focused.\nMake the wall feel personal.',
        bgColor: '#fef08a',
        textColor: '#713f12',
      },
    },
    {
      id: 'demo-f1-schedule',
      type: 'f1',
      config: {
        view: 'schedule',
        showPractice: false,
        showCountdown: true,
      },
    },
    {
      id: 'demo-f1-standings',
      type: 'f1',
      config: {
        view: 'standings',
        showPractice: false,
        showCountdown: true,
      },
    },
    {
      id: 'demo-komari',
      type: 'komari',
      config: {
        nodeId: DEMO_KOMARI_NODE_ID,
        showNetwork: true,
        refreshInterval: 30,
      },
    },
    {
      id: 'demo-focus-link',
      type: 'links',
      config: {
        bookmarkIds: ['demo-chatgpt'],
        showLabels: true,
        iconSize: 'lg',
      },
    },
    {
      id: 'demo-workflow-links',
      type: 'links',
      config: {
        title: 'Workflow',
        bookmarkIds: [
          'demo-github',
          'demo-chatgpt',
          'demo-gmail',
          'demo-figma',
          'demo-notion',
          'demo-linear',
        ],
        showLabels: true,
        iconSize: 'lg',
      },
    },
    {
      id: 'demo-inspiration-links',
      type: 'links',
      config: {
        title: 'Inspiration',
        bookmarkIds: [
          'demo-youtube',
          'demo-spotify',
          'demo-bilibili',
          'demo-reddit',
          'demo-medium',
          'demo-figma',
          'demo-notion',
          'demo-vercel',
        ],
        showLabels: true,
        iconSize: 'md',
      },
    },
  ],
  layoutsByMode: {
    desktop: [
      {
        id: 'demo-today',
        type: 'today',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 0 },
      },
      {
        id: 'demo-daily-links',
        type: 'links',
        size: { w: 2, h: 1 },
        position: { x: 3, y: 0 },
      },
      {
        id: 'demo-poster',
        type: 'photo-frame',
        size: { w: 2, h: 2 },
        position: { x: 5, y: 0 },
      },
      {
        id: 'demo-memo',
        type: 'memo',
        size: { w: 2, h: 1 },
        position: { x: 3, y: 1 },
      },
      {
        id: 'demo-workflow-links',
        type: 'links',
        size: { w: 3, h: 1 },
        position: { x: 0, y: 2 },
      },
      {
        id: 'demo-focus-link',
        type: 'links',
        size: { w: 1, h: 1 },
        position: { x: 3, y: 2 },
      },
      {
        id: 'demo-inspiration-links',
        type: 'links',
        size: { w: 2, h: 2 },
        position: { x: 4, y: 3 },
      },
      {
        id: 'demo-f1-schedule',
        type: 'f1',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 3 },
      },
      {
        id: 'demo-f1-standings',
        type: 'f1',
        size: { w: 3, h: 2 },
        position: { x: 0, y: 5 },
      },
      {
        id: 'demo-komari',
        type: 'komari',
        size: { w: 2, h: 2 },
        position: { x: 4, y: 5 },
      },
    ],
    mobile: [
      {
        id: 'demo-today',
        type: 'today',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 0 },
      },
      {
        id: 'demo-daily-links',
        type: 'links',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 2 },
      },
      {
        id: 'demo-memo',
        type: 'memo',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 3 },
      },
      {
        id: 'demo-poster',
        type: 'photo-frame',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 4 },
      },
      {
        id: 'demo-workflow-links',
        type: 'links',
        size: { w: 2, h: 1 },
        position: { x: 0, y: 6 },
      },
      {
        id: 'demo-focus-link',
        type: 'links',
        size: { w: 1, h: 1 },
        position: { x: 0, y: 7 },
      },
      {
        id: 'demo-inspiration-links',
        type: 'links',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 8 },
      },
      {
        id: 'demo-f1-schedule',
        type: 'f1',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 10 },
      },
      {
        id: 'demo-f1-standings',
        type: 'f1',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 12 },
      },
      {
        id: 'demo-komari',
        type: 'komari',
        size: { w: 2, h: 2 },
        position: { x: 0, y: 14 },
      },
    ],
  },
};

export const DEMO_WIDGETS: Widget[] = mergeWidgets(
  DEMO_WIDGET_SNAPSHOT.layoutsByMode.desktop,
  DEMO_WIDGET_SNAPSHOT.configs
);

export const DEMO_SETTINGS: Settings = {
  backgroundImage: 'radial-gradient(#d1d5db 2px, transparent 2px)',
  backgroundBlur: 0,
  backgroundOpacity: 0,
  backgroundSize: '24px 24px',
  backgroundRepeat: 'repeat',
  customFavicon: '/favicon.svg',
  customTitle: 'NaviDash Demo',
  language: 'zh',
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

export function getDemoF1Standings() {
  const drivers = [
    ['ANT', 'Andrea Kimi', 'Antonelli', 'Mercedes', 242, 6],
    ['RUS', 'George', 'Russell', 'Mercedes', 183, 2],
    ['HAM', 'Lewis', 'Hamilton', 'Ferrari', 183, 1],
    ['NOR', 'Lando', 'Norris', 'McLaren', 159, 2],
    ['LEC', 'Charles', 'Leclerc', 'Ferrari', 155, 1],
    ['VER', 'Max', 'Verstappen', 'Red Bull', 112, 0],
    ['PIA', 'Oscar', 'Piastri', 'McLaren', 104, 0],
    ['HAD', 'Isack', 'Hadjar', 'Red Bull', 68, 0],
    ['LAW', 'Liam', 'Lawson', 'Red Bull', 49, 0],
    ['GAS', 'Pierre', 'Gasly', 'Alpine', 44, 0],
    ['LIN', 'Arvid', 'Lindblad', 'Racing Bulls', 23, 0],
    ['COL', 'Franco', 'Colapinto', 'Alpine', 19, 0],
    ['BEA', 'Oliver', 'Bearman', 'Haas', 18, 0],
    ['BOR', 'Gabriel', 'Bortoleto', 'Audi', 10, 0],
    ['HUL', 'Nico', 'Hülkenberg', 'Audi', 6, 0],
    ['SAI', 'Carlos', 'Sainz', 'Williams', 6, 0],
    ['ALB', 'Alexander', 'Albon', 'Williams', 5, 0],
    ['OCO', 'Esteban', 'Ocon', 'Haas', 3, 0],
    ['ALO', 'Fernando', 'Alonso', 'Aston Martin', 3, 0],
    ['TSU', 'Yuki', 'Tsunoda', 'Racing Bulls', 0, 0],
    ['STR', 'Lance', 'Stroll', 'Aston Martin', 0, 0],
    ['BOT', 'Valtteri', 'Bottas', 'Cadillac', 0, 0],
    ['PER', 'Sergio', 'Pérez', 'Cadillac', 0, 0],
  ] as const;

  return {
    season: 2026,
    round: 12,
    standings: drivers.map(([code, givenName, familyName, constructor, points, wins], index) => ({
      position: index + 1,
      code,
      givenName,
      familyName,
      constructor,
      points,
      wins,
    })),
    updatedAt: new Date().toISOString(),
    stale: false,
  };
}

export function getDemoKomariNode() {
  return {
    id: DEMO_KOMARI_NODE_ID,
    name: 'Tokyo Edge',
    regionFlag: '🇯🇵',
    online: true,
    updatedAt: new Date().toISOString(),
    uptimeSeconds: 37 * 86_400 + 12 * 3_600,
    cpuPercent: 18.6,
    memory: {
      usedBytes: 3.4 * 1024 ** 3,
      totalBytes: 8 * 1024 ** 3,
      percent: 42.5,
    },
    disk: {
      usedBytes: 42 * 1024 ** 3,
      totalBytes: 160 * 1024 ** 3,
      percent: 26.25,
    },
    network: {
      rxBytesPerSecond: 4.8 * 1024 ** 2,
      txBytesPerSecond: 1.2 * 1024 ** 2,
      totalUpBytes: 128 * 1024 ** 3,
      totalDownBytes: 462 * 1024 ** 3,
      trafficLimitBytes: 1024 ** 4,
    },
  };
}
