'use client';

import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WidgetOfType } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { createResizeObserver } from '@/lib/resizeObserver';
import { StickyNote } from 'lucide-react';

type SaveFeedbackState = 'idle' | 'saved' | 'error';

const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const INLINE_CODE_PATTERN = /`([^`]+)`/g;
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;
const ITALIC_PATTERN = /\*([^*]+)\*/g;
const DEFAULT_MEMO_BG = '#fef08a';
const DEFAULT_MEMO_TEXT = '#713f12';

function resolveColorValue(value: string | undefined, fallback: string) {
  const candidate = value?.trim();

  if (!candidate) {
    return { style: fallback };
  }

  if (
    candidate.startsWith('#') ||
    candidate.startsWith('rgb(') ||
    candidate.startsWith('rgba(') ||
    candidate.startsWith('hsl(') ||
    candidate.startsWith('hsla(') ||
    candidate.startsWith('var(')
  ) {
    return { style: candidate };
  }

  return { className: candidate };
}

function renderInlineMarkdown(text: string) {
  const tokens = text.split(/(`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.filter(Boolean).map((token, index) => {
    if (INLINE_CODE_PATTERN.test(token)) {
      const code = token.slice(1, -1);
      INLINE_CODE_PATTERN.lastIndex = 0;
      return (
        <code
          key={`${token}-${index}`}
          className="rounded bg-black/8 px-1.5 py-0.5 text-[0.92em] font-semibold"
        >
          {code}
        </code>
      );
    }

    if (LINK_PATTERN.test(token)) {
      const match = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      LINK_PATTERN.lastIndex = 0;
      if (match) {
        return (
          <a
            key={`${token}-${index}`}
            href={match[2]}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-current/45 underline-offset-4 transition-opacity hover:opacity-70"
          >
            {match[1]}
          </a>
        );
      }
    }

    if (BOLD_PATTERN.test(token)) {
      const bold = token.slice(2, -2);
      BOLD_PATTERN.lastIndex = 0;
      return <strong key={`${token}-${index}`} className="font-semibold">{bold}</strong>;
    }

    if (ITALIC_PATTERN.test(token)) {
      const italic = token.slice(1, -1);
      ITALIC_PATTERN.lastIndex = 0;
      return <em key={`${token}-${index}`} className="italic">{italic}</em>;
    }

    return <Fragment key={`${token}-${index}`}>{token}</Fragment>;
  });
}

function renderMarkdownBlocks(content: string) {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="space-y-1.5 pl-5">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`} className="list-disc">
            {renderInlineMarkdown(item)}
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      blocks.push(<div key={`space-${index}`} className="h-3" />);
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    const quoteMatch = trimmed.match(/^>\s+(.+)$/);
    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);

    if (listMatch) {
      listItems.push(listMatch[1]);
      return;
    }

    flushList();

    if (headingMatch) {
      const level = headingMatch[1].length;
      const className =
        level === 1
          ? 'text-base font-semibold tracking-tight'
          : level === 2
            ? 'text-sm font-semibold'
            : 'text-[13px] font-semibold uppercase tracking-[0.08em] opacity-70';
      blocks.push(
        <p key={`heading-${index}`} className={className}>
          {renderInlineMarkdown(headingMatch[2])}
        </p>
      );
      return;
    }

    if (quoteMatch) {
      blocks.push(
        <blockquote
          key={`quote-${index}`}
          className="border-l border-current/20 pl-3 italic opacity-80"
        >
          {renderInlineMarkdown(quoteMatch[1])}
        </blockquote>
      );
      return;
    }

    if (trimmed === '---') {
      blocks.push(<div key={`divider-${index}`} className="my-1 border-t border-current/15" />);
      return;
    }

    blocks.push(
      <p key={`paragraph-${index}`} className="whitespace-pre-wrap break-words">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushList();
  return blocks;
}

const MemoWidget = ({ widget }: { widget: WidgetOfType<'memo'> }) => {
  const { updateWidget, saveWidgetConfigs } = useWidgetStore();
  const t = useTranslations('Widgets');

  const [content, setContent] = useState(widget.config?.content || '');
  const [isEditing, setIsEditing] = useState(!(widget.config?.content || '').trim());
  const [isComposing, setIsComposing] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedbackState>('idle');
  const [showBottomHint, setShowBottomHint] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedContentRef = useRef(widget.config?.content || '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLButtonElement | null>(null);
  const isDirty = content !== (widget.config?.content || '');
  const hasContent = content.trim().length > 0;
  const renderedContent = useMemo(() => renderMarkdownBlocks(content), [content]);

  useEffect(() => {
    const remoteContent = widget.config?.content || '';

    // 只在本地内容仍然等于上一次已同步内容时，接受外部同步结果，
    // 避免把远端更新误判为“本地脏数据”而卡住自动同步。
    if (remoteContent !== lastSyncedContentRef.current && content === lastSyncedContentRef.current) {
      setContent(remoteContent);
    }

    lastSyncedContentRef.current = remoteContent;
  }, [content, widget.config?.content]);

  const showFeedback = useCallback((nextState: SaveFeedbackState) => {
    setSaveFeedback(nextState);

    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    if (nextState !== 'idle') {
      feedbackTimeoutRef.current = setTimeout(() => {
        setSaveFeedback('idle');
        feedbackTimeoutRef.current = null;
      }, nextState === 'saved' ? 1400 : 2200);
    }
  }, []);

  const persistContent = useCallback(async () => {
    if (!isDirty) return true;

    updateWidget(widget.id, {
      config: {
        ...widget.config,
        content,
      },
    });

    const saved = await saveWidgetConfigs();
    showFeedback(saved ? 'saved' : 'error');
    return saved;
  }, [content, isDirty, saveWidgetConfigs, showFeedback, updateWidget, widget.config, widget.id]);

  useEffect(() => {
    if (!isDirty || isComposing) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void persistContent();
      saveTimeoutRef.current = null;
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [isComposing, isDirty, persistContent]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    textareaRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    const container = isEditing ? textareaRef.current : previewRef.current;
    if (!container) return;

    const updateBottomHint = () => {
      const remainingScroll = container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowBottomHint(remainingScroll > 6);
    };

    updateBottomHint();
    container.addEventListener('scroll', updateBottomHint, { passive: true });

    const resizeObserver = createResizeObserver(() => updateBottomHint());
    resizeObserver?.observe(container);

    return () => {
      container.removeEventListener('scroll', updateBottomHint);
      resizeObserver?.disconnect();
    };
  }, [content, isEditing, renderedContent]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const backgroundColor = resolveColorValue(widget.config?.bgColor, DEFAULT_MEMO_BG);
  const foregroundColor = resolveColorValue(widget.config?.textColor, DEFAULT_MEMO_TEXT);

  return (
    <div
      className={cn(
        'flex flex-col w-full h-full relative overflow-hidden transition-all duration-300',
        backgroundColor.className
      )}
      style={backgroundColor.style ? { backgroundColor: backgroundColor.style } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.34),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_bottom,transparent_27px,rgba(255,255,255,0.22)_28px)] [background-size:100%_28px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/18 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/5 to-transparent opacity-40" />
      <div className="relative z-10 flex items-center justify-between p-3 pb-1 shrink-0">
        <div className="flex items-center gap-2 opacity-60">
          <StickyNote
            size={16}
            className={foregroundColor.className}
            style={foregroundColor.style ? { color: foregroundColor.style } : undefined}
          />
          <span
            className={cn('text-ui-title', foregroundColor.className)}
            style={foregroundColor.style ? { color: foregroundColor.style } : undefined}
          >
            {t('memo')}
          </span>
        </div>
        <div
          className={cn(
            'rounded-full px-2 py-0.5 text-ui-muted transition-all duration-300',
            foregroundColor.className,
            saveFeedback === 'idle' && 'opacity-0',
            saveFeedback === 'saved' && 'bg-white/28 opacity-65',
            saveFeedback === 'error' && 'bg-red-500/12 text-red-900 opacity-85'
          )}
          style={foregroundColor.style ? { color: foregroundColor.style } : undefined}
        >
          {saveFeedback === 'saved' ? t('memo_saved_hint') : saveFeedback === 'error' ? t('memo_save_failed') : ''}
        </div>
      </div>

      <div className="relative z-10 min-h-0 flex-1 overflow-hidden px-3">
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-x-3 bottom-0 z-10 h-8 bg-gradient-to-t from-black/8 via-black/[0.03] to-transparent transition-opacity duration-200',
            showBottomHint ? 'opacity-100' : 'opacity-0'
          )}
        />
        {isEditing || !hasContent ? (
          <textarea
            ref={textareaRef}
            className={cn(
              'memo-scrollbar h-full w-full overflow-y-auto bg-transparent px-0 pb-3 pt-2 border-none outline-none resize-none text-sm font-normal leading-7 placeholder-black/20',
              foregroundColor.className
            )}
            style={foregroundColor.style ? { color: foregroundColor.style } : undefined}
            placeholder={t('memo_placeholder')}
            value={content}
            onChange={handleChange}
            onFocus={() => setIsEditing(true)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onBlur={() => {
              setIsEditing(false);
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
              }
              void persistContent();
            }}
            spellCheck={false}
            aria-label={t('memo')}
          />
        ) : (
          <button
            type="button"
            ref={previewRef}
            onClick={() => setIsEditing(true)}
            className={cn(
              'memo-scrollbar relative h-full w-full overflow-y-auto px-0 pb-3 pt-2 text-left text-sm font-normal leading-7',
              foregroundColor.className
            )}
            style={foregroundColor.style ? { color: foregroundColor.style } : undefined}
            aria-label={t('memo_edit_content')}
          >
            <div className="space-y-2 break-words">{renderedContent}</div>
          </button>
        )}
      </div>
    </div>
  );
};

export default MemoWidget;
