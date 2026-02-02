import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useWidgetStore } from '@/store/useWidgetStore';
import { Clock, CloudSun, Link as LinkIcon, Calendar, CheckSquare, Image as ImageIcon, CalendarDays, StickyNote, BarChart } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useTranslations } from 'next-intl';

interface WidgetPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * WidgetPicker Component
 * 小组件选择器模态框
 * 允许用户从预定义列表中选择并添加新的小组件到仪表盘
 */
export default function WidgetPicker({ isOpen, onClose }: WidgetPickerProps) {
  const { widgets, addWidget } = useWidgetStore();
  const t = useTranslations('Widgets');
  const [activeCategory, setActiveCategory] = useState('all');

  /**
   * 处理添加小组件逻辑
   * 创建一个新的 Widget 实例，分配唯一 ID，并设置初始尺寸
   */
  const handleAddWidget = (type: string, defaultSize: { w: number, h: number }) => {
    // 计算下一个空闲行的 Y 坐标，避免覆盖现有组件
    const maxY = widgets.reduce((max, w) => {
      const bottom = (w.position?.y || 0) + w.size.h;
      return bottom > max ? bottom : max;
    }, 0);

    const newWidget = {
      id: uuidv4(),
      type: type as any,
      size: defaultSize,
      position: { x: 0, y: maxY }, // 放在最底部
      config: {}, // 初始配置为空
    };
    addWidget(newWidget);
    onClose();
  };

  // 定义可用的小组件类型列表
  const widgetTypes = [
    // System
    {
      type: 'clock',
      title: t('clock'),
      description: t('clock_desc'),
      icon: <Clock size={32} className="text-blue-600" />,
      defaultSize: { w: 2, h: 1 },
      category: 'system'
    },
    {
      type: 'weather',
      title: t('weather'),
      description: t('weather_desc'),
      icon: <CloudSun size={32} className="text-orange-500" />,
      defaultSize: { w: 2, h: 1 },
      category: 'system'
    },
    {
      type: 'date',
      title: t('date'),
      description: t('date_desc'),
      icon: <CalendarDays size={32} className="text-red-500" />,
      defaultSize: { w: 1, h: 1 },
      category: 'system'
    },
    // Productivity
    {
      type: 'calendar',
      title: t('calendar'),
      description: t('calendar_desc'),
      icon: <Calendar size={32} className="text-purple-500" />,
      defaultSize: { w: 1, h: 2 },
      category: 'productivity'
    },
    {
      type: 'todo',
      title: t('todo'),
      description: t('todo_desc'),
      icon: <CheckSquare size={32} className="text-indigo-500" />,
      defaultSize: { w: 1, h: 2 },
      category: 'productivity'
    },
    {
      type: 'memo',
      title: t('memo'),
      description: t('memo_desc'),
      icon: <StickyNote size={32} className="text-yellow-500" />,
      defaultSize: { w: 1, h: 1 },
      category: 'productivity'
    },
    // Custom
    {
      type: 'quick-link',
      title: t('quick_link'),
      description: t('quick_link_desc'),
      icon: <LinkIcon size={32} className="text-green-500" />,
      defaultSize: { w: 1, h: 1 },
      category: 'custom'
    },
    {
      type: 'photo-frame',
      title: t('photo_frame'),
      description: t('photo_frame_desc'),
      icon: <ImageIcon size={32} className="text-pink-500" />,
      defaultSize: { w: 2, h: 2 },
      category: 'custom'
    },
    {
      type: 'most-visited',
      title: t('most_visited'),
      description: t('most_visited_desc'),
      icon: <BarChart size={32} className="text-blue-500" />,
      defaultSize: { w: 2, h: 2 },
      category: 'custom'
    },
  ];

  const categories = [
    { id: 'all', label: t('cat_all') },
    { id: 'system', label: t('cat_system') },
    { id: 'productivity', label: t('cat_productivity') },
    { id: 'custom', label: t('cat_custom') },
  ];

  const filteredWidgets = activeCategory === 'all' 
    ? widgetTypes 
    : widgetTypes.filter(w => w.category === activeCategory);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('add_widget_title')} className="max-w-3xl">
      {/* Categories */}
      <div className="flex space-x-2 mb-6 border-b border-gray-100 pb-2 overflow-x-auto scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-gray-900 text-white shadow-sm scale-105'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
        {filteredWidgets.map((widget) => (
          <button
            key={widget.type}
            onClick={() => handleAddWidget(widget.type, widget.defaultSize)}
            className="flex flex-col items-center p-6 rounded-xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`${t('add_widget_title')} - ${widget.title}`}
          >
            <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-colors mb-4 ring-1 ring-gray-100 group-hover:ring-blue-100">
              {widget.icon}
            </div>
            <h4 className="font-semibold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">{widget.title}</h4>
            <p className="text-xs text-gray-500 line-clamp-2 px-1 leading-relaxed">{widget.description}</p>
          </button>
        ))}
      </div>
    </Modal>
  );
}
