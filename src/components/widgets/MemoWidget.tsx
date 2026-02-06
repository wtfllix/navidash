'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Widget } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { StickyNote } from 'lucide-react';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const MemoWidget = ({ widget }: { widget: Widget }) => {
  const { updateWidget } = useWidgetStore();
  const t = useTranslations('Widgets');

  // Local state for immediate typing feedback
  const [content, setContent] = useState(widget.config?.content || '');

  // Debounce saving to store
  const debouncedContent = useDebounce(content, 1000);

  // Sync with store when debounced value changes (Local -> Store)
  useEffect(() => {
    if (debouncedContent !== (widget.config?.content || '')) {
      updateWidget(widget.id, {
        config: {
          ...widget.config,
          content: debouncedContent
        }
      });
    }
  }, [debouncedContent, widget.id, widget.config, updateWidget]);

  // Sync local state when widget prop changes (Store -> Local)
  // This handles updates from other devices/DataSyncer
  useEffect(() => {
    const remoteContent = widget.config?.content || '';
    if (remoteContent !== content && remoteContent !== debouncedContent) {
      setContent(remoteContent);
    }
    // Note: We deliberately exclude 'content' and 'debouncedContent' dependencies to avoid loops
    // We only want to run this when the *prop* changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.config?.content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Determine colors based on config or default to yellow sticky note style
  const bgColor = widget.config?.bgColor || 'bg-yellow-200';
  const textColor = widget.config?.textColor || 'text-yellow-900';

  return (
    <div className={cn(
      "flex flex-col w-full h-full relative overflow-hidden transition-all duration-300",
      bgColor
    )}>
      <div className="flex items-center justify-between p-3 pb-1 shrink-0">
        <div className="flex items-center gap-2 opacity-60">
          <StickyNote size={16} className={textColor} />
          <span className={cn("text-xs font-semibold", textColor)}>{t('memo')}</span>
        </div>
      </div>

      <textarea
        className={cn(
          "flex-1 w-full h-full p-3 bg-transparent border-none outline-none resize-none text-sm font-medium leading-relaxed placeholder-black/20",
          textColor
        )}
        placeholder={t('memo_placeholder')}
        value={content}
        onChange={handleChange}
        spellCheck={false}
      />
    </div>
  );
};

export default MemoWidget;
