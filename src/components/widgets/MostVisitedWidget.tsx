import React, { useMemo } from 'react';
import { Widget, Bookmark } from '@/types';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { useStatsStore } from '@/store/useStatsStore';
import { useTranslations } from 'next-intl';
import { BarChart } from 'lucide-react';
import { getIcon } from '@/lib/iconUtils';

export default function MostVisitedWidget({ widget }: { widget: Widget }) {
  const { bookmarks } = useBookmarkStore();
  const { visitCounts, incrementVisit } = useStatsStore();
  const t = useTranslations('Widgets');
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Flatten bookmarks to a map for easy lookup
  const bookmarkMap = useMemo(() => {
    const map = new Map<string, Bookmark>();
    const traverse = (items: Bookmark[]) => {
      items.forEach((item) => {
        if (item.url) { // Only map items with URLs (links)
          map.set(item.id, item);
        }
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(bookmarks);
    return map;
  }, [bookmarks]);

  // Mock data for demo mode
  const mockBookmarks: Bookmark[] = useMemo(() => [
    { id: 'demo-1', title: 'GitHub', url: 'https://github.com', icon: 'github' },
    { id: 'demo-2', title: 'Google', url: 'https://google.com', icon: 'search' },
    { id: 'demo-3', title: 'YouTube', url: 'https://youtube.com', icon: 'youtube' },
    { id: 'demo-4', title: 'Twitter', url: 'https://twitter.com', icon: 'twitter' },
    { id: 'demo-5', title: 'ChatGPT', url: 'https://chat.openai.com', icon: 'bot' },
    { id: 'demo-6', title: 'Vercel', url: 'https://vercel.com', icon: 'server' },
    { id: 'demo-7', title: 'React', url: 'https://react.dev', icon: 'code' },
    { id: 'demo-8', title: 'Next.js', url: 'https://nextjs.org', icon: 'cpu' },
  ], []);

  // Responsive layout configuration
  const { w, h } = widget.size;
  const isWide = w >= 2;
  const isTall = h >= 2;
  
  // Dynamic item limit based on size
  const itemLimit = useMemo(() => {
    if (w === 1 && h === 1) return 3;
    if (w === 1 && h >= 2) return 6;
    if (w >= 2 && h === 1) return 6;
    if (w >= 2 && h >= 2) return 8;
    return 5;
  }, [w, h]);

  // Get top visited bookmarks
  const topBookmarks = useMemo(() => {
    if (isDemoMode) {
      const real = Array.from(bookmarkMap.values()).slice(0, itemLimit);
      return real.length >= 3 ? real : mockBookmarks.slice(0, itemLimit);
    }

    return Object.entries(visitCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, itemLimit)
      .map(([id]) => bookmarkMap.get(id))
      .filter((b): b is Bookmark => !!b);
  }, [visitCounts, bookmarkMap, isDemoMode, mockBookmarks, itemLimit]);

  return (
    <div className="flex flex-col h-full bg-white p-3 overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2 flex-shrink-0">
        <BarChart size={16} className="text-blue-500" />
        <span className="truncate">{t('most_visited')}</span>
      </h3>

      <div className={`flex-1 min-h-0 grid gap-2 ${isWide ? 'grid-cols-2' : 'grid-cols-1'} content-start overflow-y-auto scrollbar-hide`}>
        {topBookmarks.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center text-gray-400 text-xs text-center h-full min-h-[60px]">
            <p>{t('no_history')}</p>
          </div>
        ) : (
          topBookmarks.map((bookmark, index) => (
            <a
              key={bookmark.id}
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                incrementVisit(bookmark.id);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100"
              title={bookmark.title}
            >
              <div className="flex-shrink-0 w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center text-blue-500 transition-transform group-hover:scale-110">
                 {getIcon(bookmark.icon, false, 14)}
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="text-xs font-medium text-gray-700 truncate group-hover:text-blue-600">
                  {bookmark.title}
                </div>
                {/* Only show domain if not super small 1x1 or if we have space */}
                {!(w === 1 && h === 1) && (
                  <div className="text-[10px] text-gray-400 truncate leading-tight">
                    {new URL(bookmark.url || '').hostname.replace(/^www\./, '')}
                  </div>
                )}
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
