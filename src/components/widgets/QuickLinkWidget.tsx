import React, { useState } from 'react';
import { Widget } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { ExternalLink, Edit2, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * QuickLinkWidget Component
 * 快捷链接组件：显示一个可点击的链接图标和标题
 * 支持内联编辑模式，直接修改标题和 URL
 * 使用 React.memo 优化渲染性能
 */
export default React.memo(function QuickLinkWidget({ widget }: { widget: Widget }) {
  const { updateWidget } = useWidgetStore();
  // 如果没有 URL 配置，默认进入编辑模式
  const [isEditing, setIsEditing] = useState(!widget.config?.url);
  const [title, setTitle] = useState(widget.config?.title || '');
  const [url, setUrl] = useState(widget.config?.url || '');
  const t = useTranslations('Widgets');

  const handleSave = () => {
    if (title && url) {
      updateWidget(widget.id, {
        config: { ...widget.config, title, url }
      });
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col h-full w-full p-4 space-y-3">
        <div className="text-xs font-bold uppercase text-gray-400">{t('configure_link')}</div>
        {/* 编辑表单：标题输入 */}
        <input
          type="text"
          placeholder={t('placeholder_title')}
          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {/* 编辑表单：URL 输入 */}
        <input
          type="text"
          placeholder={t('placeholder_url')}
          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex space-x-2 mt-auto">
          <button 
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700 flex items-center justify-center space-x-1"
          >
            <Check size={12} /> <span>{t('save')}</span>
          </button>
          {/* 只有在已有 URL 的情况下才允许取消编辑（如果是新组件则必须配置） */}
          {widget.config?.url && (
             <button 
                onClick={() => setIsEditing(false)}
                className="px-3 bg-gray-100 text-gray-600 text-xs py-1.5 rounded hover:bg-gray-200"
             >
                <X size={12} />
             </button>
          )}
        </div>
      </div>
    );
  }

  const getValidUrl = (url?: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  return (
    <div className="relative group w-full h-full">
      {/* 悬停显示的编辑按钮 */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 text-gray-500 z-10"
        aria-label={t('configure_link')}
      >
        <Edit2 size={12} />
      </button>
      
      <a 
        href={getValidUrl(widget.config?.url)} 
        target="_blank" 
        rel="noreferrer"
        className="flex flex-col items-center justify-center w-full h-full p-4 space-y-3 group-hover:bg-gray-50/50 transition-colors"
        aria-label={widget.config?.title || t('quick_link')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-200" aria-hidden="true">
           {/* TODO: 后续可以集成 Favicon 获取服务 */}
           <ExternalLink size={24} />
        </div>
        <span className="font-medium text-gray-700 text-sm truncate max-w-full px-2">{widget.config?.title}</span>
      </a>
    </div>
  );
});
