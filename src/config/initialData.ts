import { Bookmark } from '@/types';

const defaultBookmarks: Bookmark[] = [
  {
    id: '1',
    title: 'TrueNAS (192.168.31.15)',
    icon: 'server',
    children: [
      { id: '1-1', title: '📁Filebrowser', url: 'http://192.168.31.15:30051' },
      { id: '1-2', title: '🖼️immich', url: 'http://192.168.31.15:30041' },
      { id: '1-3', title: 'Minio', url: 'http://192.168.31.15:9000' },
      { id: '1-4', title: 'TrueNAS', url: 'http://192.168.31.15' },
    ],
  },
  {
    id: '2',
    title: 'PVE (192.168.31.87)',
    icon: 'cpu',
    children: [
      { id: '2-1', title: 'PVE', url: 'https://192.168.31.87:8006' },
      { id: '2-2', title: 'iStoreOS', url: 'http://192.168.31.88' },
    ],
  },
  {
    id: '3',
    title: '工具服务',
    icon: 'tool',
    children: [
      { id: '3-1', title: '入职检查', url: 'https://nav.lonsdaleite.cc/fieldcheck.html' },
      { id: '3-2', title: 'Joplin', url: 'https://joplin.lonsdaleite.cc' },
      { id: '3-3', title: '压缩', url: 'https://compress.lonsdaleite.cc' },
    ],
  },
  {
    id: '4',
    title: '娱乐媒体',
    icon: 'play',
    children: [
      { id: '4-1', title: 'Bilibili', url: 'https://bilibili.com' },
      { id: '4-2', title: '虎牙', url: 'https://huya.com' },
      { id: '4-3', title: '抖音', url: 'https://douyin.com' },
      { id: '4-4', title: 'Emby', url: 'http://192.168.31.19:8096/' },
    ],
  },
  {
    id: '5',
    title: '社交网络',
    icon: 'globe',
    children: [
      { id: '5-1', title: 'Weibo', url: 'https://weibo.com' },
      { id: '5-2', title: 'Facebook', url: 'https://facebook.com' },
      { id: '5-3', title: 'Instagram', url: 'https://instagram.com' },
      { id: '5-4', title: 'Reddit', url: 'https://reddit.com' },
    ],
  },
];

export const initialBookmarks: Bookmark[] = process.env.NEXT_PUBLIC_DEFAULT_BOOKMARKS
  ? (() => {
      try {
        return JSON.parse(process.env.NEXT_PUBLIC_DEFAULT_BOOKMARKS);
      } catch (e) {
        console.error('Failed to parse NEXT_PUBLIC_DEFAULT_BOOKMARKS', e);
        return defaultBookmarks;
      }
    })()
  : defaultBookmarks;
