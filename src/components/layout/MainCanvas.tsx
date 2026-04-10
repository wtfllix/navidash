'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Widget } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import WidgetPicker from '../widgets/WidgetPicker';
import WidgetSettingsModal from '../widgets/WidgetSettingsModal';
import DroppableGridArea from './DroppableGridArea';
import { WidgetCreatedDetail, WidgetDropPreviewDetail } from '@/lib/widgetPlacement';
import { useCanvasMetrics } from './useCanvasMetrics';
import { useCanvasDragPreview } from './useCanvasDragPreview';
import { useCanvasLayoutItems } from './useCanvasLayoutItems';
import MainCanvasBackground from './MainCanvasBackground';
import CanvasWidgetItem from './CanvasWidgetItem';
import WidgetDeleteZone from './WidgetDeleteZone';
import { useDragDrop } from './DragDropProvider';
import CanvasLinkLauncher from './CanvasLinkLauncher';
import { collectLauncherLinks, searchLauncherLinks } from '@/lib/linkLauncher';
import { buildSearchUrl } from '@/lib/searchEngines';
import {
  pushLauncherOpenedLink,
  pushLauncherSearchHistory,
  readLauncherOpenedLinks,
  readLauncherSearchHistory,
  type LauncherOpenedLinkHistoryItem,
  type LauncherSearchHistoryItem,
} from '@/lib/linkLauncherHistory';

const GRID_ROW_HEIGHT = 120;
const GRID_MARGIN: [number, number] = [8, 8];

/**
 * MainCanvas Component
 * 主内容区域，负责组合画布背景、放置网格与 widget 视图层。
 */
export default function MainCanvas() {
  const t = useTranslations('Widgets');
  const {
    backgroundImage,
    backgroundBlur,
    backgroundOpacity,
    backgroundSize,
    backgroundRepeat,
  } = useSettingsStore();
  const { widgets, setWidgets, removeWidget } = useWidgetStore();
  const {
    isEditing,
    isWidgetPickerOpen,
    closeWidgetPicker,
    isSettingsOpen,
    setCurrentCanvasCols,
  } = useUIStore();
  const { isDragging: isStoreDragging } = useDragDrop();

  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [mounted, setMounted] = useState(false);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [launcherQuery, setLauncherQuery] = useState('');
  const [selectedLauncherIndex, setSelectedLauncherIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState<LauncherSearchHistoryItem[]>([]);
  const [openedLinksHistory, setOpenedLinksHistory] = useState<LauncherOpenedLinkHistoryItem[]>([]);
  const widgetsRef = useRef(widgets);
  const [dropPreviewUpdates, setDropPreviewUpdates] = useState<
    Array<{ id: string; position: { x: number; y: number } }>
  >([]);

  const { width, containerRef, currentCols, cellWidth, toPixelRect } = useCanvasMetrics({
    rowHeight: GRID_ROW_HEIGHT,
    margin: GRID_MARGIN,
  });

  const {
    handleDragHandlePointerDown,
    draggingWidgetId,
    dragPreviewPosition,
    dragPointerOffset,
    editPreviewUpdates,
  } = useCanvasDragPreview({
    widgets,
    isEditing,
    cellWidth,
    currentCols,
    rowHeight: GRID_ROW_HEIGHT,
    margin: GRID_MARGIN,
    setWidgets,
  });

  const { items: canvasItems, canvasHeight } = useCanvasLayoutItems({
    widgets,
    draggingWidgetId,
    dragPreviewPosition,
    dragPointerOffset,
    editPreviewUpdates,
    dropPreviewUpdates,
    toPixelRect,
  });

  const launcherLinks = useMemo(() => collectLauncherLinks(widgets), [widgets]);
  const launcherResults = useMemo(
    () => searchLauncherLinks(launcherLinks, launcherQuery),
    [launcherLinks, launcherQuery]
  );
  const launcherItems = useMemo(() => {
    if (!launcherQuery.trim()) {
      const searchItems = searchHistory.map((item) => ({
        id: item.id,
        kind: 'search' as const,
        title: item.query,
        subtitle: t('launcher_search_history_item'),
        query: item.query,
      }));

      const openedLinkItems = openedLinksHistory.map((item) => ({
        id: item.id,
        kind: 'link' as const,
        title: item.title,
        subtitle: item.hostname || item.url,
        sourceLabel:
          item.sourceType === 'quick-link'
            ? t('launcher_source_quick_link')
            : t('launcher_source_links'),
        link:
          launcherLinks.find((link) => link.url === item.url) ?? {
            id: item.id,
            title: item.title,
            url: item.url,
            hostname: item.hostname,
            keywords: '',
            sourceWidgetId: '',
            sourceType: item.sourceType,
          },
      }));

      return [...searchItems, ...openedLinkItems];
    }

    return launcherResults.map((link) => ({
      id: link.id,
      kind: 'link' as const,
      title: link.title,
      subtitle: link.hostname || link.url,
      sourceLabel:
        link.sourceType === 'quick-link'
          ? t('launcher_source_quick_link')
          : t('launcher_source_links'),
      link,
    }));
  }, [launcherLinks, launcherQuery, launcherResults, openedLinksHistory, searchHistory, t]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSearchHistory(readLauncherSearchHistory());
    setOpenedLinksHistory(readLauncherOpenedLinks());
  }, []);

  useEffect(() => {
    widgetsRef.current = widgets;
  }, [widgets]);

  useEffect(() => {
    setCurrentCanvasCols(currentCols);
  }, [currentCols, setCurrentCanvasCols]);

  useEffect(() => {
    const handlePreview = (event: CustomEvent<WidgetDropPreviewDetail>) => {
      if (!event.detail.active) {
        setDropPreviewUpdates([]);
        return;
      }
      setDropPreviewUpdates(event.detail.updates);
    };

    window.addEventListener('widget-drop-preview', handlePreview as EventListener);
    return () => window.removeEventListener('widget-drop-preview', handlePreview as EventListener);
  }, []);

  useEffect(() => {
    const handleCreated = (event: CustomEvent<WidgetCreatedDetail>) => {
      if (!event.detail.shouldOpenSettings) return;

      requestAnimationFrame(() => {
        const targetWidget = widgetsRef.current.find((widget) => widget.id === event.detail.widgetId);
        if (targetWidget) {
          setEditingWidget(targetWidget);
        }
      });
    };

    window.addEventListener('widget-created', handleCreated as EventListener);
    return () => window.removeEventListener('widget-created', handleCreated as EventListener);
  }, []);

  useEffect(() => {
    setSelectedLauncherIndex((currentIndex) => {
      if (launcherItems.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, launcherItems.length - 1);
    });
  }, [launcherItems]);

  useEffect(() => {
    const shouldIgnoreKeyboardEvent = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return true;
      }

      if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
        return true;
      }

      if (isEditing || isWidgetPickerOpen || isSettingsOpen || !!editingWidget || isStoreDragging) {
        return true;
      }

      return false;
    };

    const closeLauncher = () => {
      setLauncherOpen(false);
      setLauncherQuery('');
      setSelectedLauncherIndex(0);
    };

    const openSelectedItem = () => {
      const selectedItem = launcherItems[selectedLauncherIndex];

      if (!selectedItem) {
        if (launcherQuery.trim()) {
          setSearchHistory(pushLauncherSearchHistory(launcherQuery.trim()));
          window.open(buildSearchUrl(launcherQuery.trim()), '_blank', 'noopener,noreferrer');
          closeLauncher();
        }
        return;
      }

      if (selectedItem.kind === 'search' && selectedItem.query) {
        setSearchHistory(pushLauncherSearchHistory(selectedItem.query));
        window.open(buildSearchUrl(selectedItem.query), '_blank', 'noopener,noreferrer');
        closeLauncher();
        return;
      }

      if (selectedItem.kind === 'link' && selectedItem.link) {
        setOpenedLinksHistory(pushLauncherOpenedLink(selectedItem.link));
        window.open(selectedItem.link.url, '_blank', 'noopener,noreferrer');
      }

      closeLauncher();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreKeyboardEvent(event)) {
        return;
      }

      if (launcherOpen) {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeLauncher();
          return;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          openSelectedItem();
          return;
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedLauncherIndex((currentIndex) =>
            launcherItems.length === 0 ? 0 : (currentIndex + 1) % launcherItems.length
          );
          return;
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedLauncherIndex((currentIndex) =>
            launcherItems.length === 0
              ? 0
              : (currentIndex - 1 + launcherItems.length) % launcherItems.length
          );
          return;
        }

        if (event.key === 'Backspace') {
          event.preventDefault();
          setLauncherQuery((currentQuery) => currentQuery.slice(0, -1));
          return;
        }
      }

      if (event.key.length !== 1 || !event.key.trim()) {
        return;
      }

      if (launcherLinks.length === 0) {
        return;
      }

      event.preventDefault();
      setLauncherOpen(true);
      setSelectedLauncherIndex(0);
      setLauncherQuery((currentQuery) => `${currentQuery}${event.key}`);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    editingWidget,
    isEditing,
    isSettingsOpen,
    isStoreDragging,
    isWidgetPickerOpen,
    launcherItems,
    launcherLinks.length,
    launcherOpen,
    launcherQuery,
    selectedLauncherIndex,
  ]);

  const handleCloseLauncher = () => {
    setLauncherOpen(false);
    setLauncherQuery('');
    setSelectedLauncherIndex(0);
  };

  const handleSelectLauncherItem = (
    item: React.ComponentProps<typeof CanvasLinkLauncher>['items'][number]
  ) => {
    if (item.kind === 'search' && item.query) {
      setSearchHistory(pushLauncherSearchHistory(item.query));
      window.open(buildSearchUrl(item.query), '_blank', 'noopener,noreferrer');
      handleCloseLauncher();
      return;
    }

    if (item.kind === 'link' && item.link) {
      setOpenedLinksHistory(pushLauncherOpenedLink(item.link));
      window.open(item.link.url, '_blank', 'noopener,noreferrer');
    }

    handleCloseLauncher();
  };

  return (
    <main
      className="flex-1 relative flex flex-col overflow-hidden focus:outline-none"
      data-main-canvas
      tabIndex={-1}
    >
      <MainCanvasBackground
        backgroundImage={backgroundImage}
        backgroundBlur={backgroundBlur}
        backgroundOpacity={backgroundOpacity}
        backgroundSize={backgroundSize}
        backgroundRepeat={backgroundRepeat}
      />

      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        <div ref={containerRef} className="max-w-7xl mx-auto min-h-[500px]">
          {mounted && width > 0 && (
            <DroppableGridArea
              containerRef={containerRef}
              width={width}
              cols={currentCols}
              rowHeight={GRID_ROW_HEIGHT}
              margin={GRID_MARGIN}
            >
              <div className="relative w-full" style={{ height: `${canvasHeight}px` }}>
                {canvasItems.map(
                  ({
                    widget,
                    rect,
                    layoutRect,
                    dragOffset,
                    hasPreviewTarget,
                    isDragging,
                    isBeingPushed,
                  }) => (
                  <CanvasWidgetItem
                    key={widget.id}
                    widget={widget}
                    rect={rect}
                    layoutRect={layoutRect}
                    dragOffset={dragOffset}
                    hasPreviewTarget={hasPreviewTarget}
                    isDragging={isDragging}
                    isBeingPushed={isBeingPushed}
                    onEdit={setEditingWidget}
                    onDragHandlePointerDown={handleDragHandlePointerDown}
                  />
                  )
                )}
              </div>
            </DroppableGridArea>
          )}
        </div>
      </div>

      <WidgetPicker isOpen={isWidgetPickerOpen} onClose={closeWidgetPicker} />
      <WidgetDeleteZone
        visible={isStoreDragging}
      />
      <WidgetSettingsModal
        isOpen={!!editingWidget}
        widget={editingWidget}
        onClose={() => setEditingWidget(null)}
      />
      <CanvasLinkLauncher
        isOpen={launcherOpen}
        query={launcherQuery}
        items={launcherItems}
        selectedIndex={selectedLauncherIndex}
        searchHistory={searchHistory}
        openedLinks={openedLinksHistory}
        onClose={handleCloseLauncher}
        onSelect={handleSelectLauncherItem}
      />
    </main>
  );
}
