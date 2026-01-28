import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Bookmark } from '@/types';

/**
 * BookmarkState Interface
 * 定义书签状态管理的结构
 */
interface BookmarkState {
  bookmarks: Bookmark[]; // 书签列表数据
  addBookmark: (bookmark: Bookmark, parentId?: string) => void; // 添加书签/分类
  removeBookmark: (id: string) => void; // 移除书签/分类
  updateBookmark: (id: string, data: Partial<Bookmark>) => void; // 更新书签/分类
  setBookmarks: (bookmarks: Bookmark[]) => void; // 全量设置书签（用于导入/重置）
  fetchBookmarks: () => Promise<void>; // 从服务器获取书签数据
}

// 初始默认书签数据
const initialBookmarks: Bookmark[] = [
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

/**
 * saveToServer
 * 将书签数据持久化到服务器（JSON文件）
 * @param bookmarks 最新的书签列表
 */
const saveToServer = async (bookmarks: Bookmark[]) => {
  try {
    await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookmarks),
    });
  } catch (error) {
    console.error('Failed to save bookmarks:', error);
  }
};

/**
 * useBookmarkStore
 * 书签状态管理 Hook，使用 Zustand + Persist 中间件
 */
export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: initialBookmarks,
      // 从服务器 API 获取最新书签数据
      fetchBookmarks: async () => {
        try {
          const res = await fetch('/api/bookmarks');
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data) && data.length > 0) {
              set({ bookmarks: data });
            }
          }
        } catch (error) {
          console.error('Failed to fetch bookmarks:', error);
        }
      },
      // 添加书签或分类，支持无限层级递归添加
      addBookmark: (bookmark, parentId) => {
        set((state) => {
          let newBookmarks;
          if (!parentId) {
            // 如果没有 parentId，直接添加到根目录
            newBookmarks = [...state.bookmarks, bookmark];
          } else {
            // 递归查找父节点并添加子项
            const addRecursive = (items: Bookmark[]): Bookmark[] => {
              return items.map((item) => {
                if (item.id === parentId) {
                  return {
                    ...item,
                    children: [...(item.children || []), bookmark],
                  };
                }
                if (item.children) {
                  return {
                    ...item,
                    children: addRecursive(item.children),
                  };
                }
                return item;
              });
            };
            newBookmarks = addRecursive(state.bookmarks);
          }
          saveToServer(newBookmarks); // 同步到服务器
          return { bookmarks: newBookmarks };
        });
      },
      // 递归删除指定 ID 的书签或分类
      removeBookmark: (id) => {
        set((state) => {
            const removeRecursive = (items: Bookmark[]): Bookmark[] => {
                return items.filter(item => item.id !== id).map(item => ({
                    ...item,
                    children: item.children ? removeRecursive(item.children) : undefined
                }));
            };
            const newBookmarks = removeRecursive(state.bookmarks);
            saveToServer(newBookmarks);
            return { bookmarks: newBookmarks };
        });
      },
      // 递归更新书签信息
      updateBookmark: (id, data) => {
        set((state) => {
            const updateRecursive = (items: Bookmark[]): Bookmark[] => {
                return items.map(item => {
                    if (item.id === id) {
                        return { ...item, ...data };
                    }
                    if (item.children) {
                        return { ...item, children: updateRecursive(item.children) };
                    }
                    return item;
                });
            };
            const newBookmarks = updateRecursive(state.bookmarks);
            saveToServer(newBookmarks);
            return { bookmarks: newBookmarks };
        });
      },
      setBookmarks: (bookmarks) => {
        saveToServer(bookmarks);
        set({ bookmarks });
      },
    }),
    {
      name: 'bookmark-storage', // LocalStorage Key
    }
  )
);
