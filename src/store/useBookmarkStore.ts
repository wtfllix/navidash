import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Bookmark } from '@/types';
import { initialBookmarks } from '@/config/initialData';

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

// 初始默认书签数据 (Moved to src/config/initialData.ts)


import { useToastStore } from '@/store/useToastStore';

/**
 * saveToServer
 * 将书签数据持久化到服务器（JSON文件）
 * 使用简单的防抖机制，避免频繁请求
 * @param bookmarks 最新的书签列表
 */
let saveTimeout: NodeJS.Timeout | null = null;

const saveToServer = (bookmarks: Bookmark[]) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookmarks),
      });
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
      // Notify user about the failure
      useToastStore.getState().addToast('save_error', 'error');
    } finally {
      saveTimeout = null;
    }
  }, 1000); // 1秒防抖
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
            /**
             * 递归函数：在书签树中查找目标父节点并添加新书签
             * @param {Bookmark[]} items - 当前层级的书签列表
             * @returns {Bookmark[]} 更新后的书签列表
             */
            const addRecursive = (items: Bookmark[]): Bookmark[] => {
              return items.map((item) => {
                // 找到目标父节点
                if (item.id === parentId) {
                  return {
                    ...item,
                    children: [...(item.children || []), bookmark],
                  };
                }
                // 如果当前节点有子节点，继续递归查找
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
