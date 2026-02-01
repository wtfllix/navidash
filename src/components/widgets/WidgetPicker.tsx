import React from 'react';
import Modal from '@/components/ui/Modal';
import { useWidgetStore } from '@/store/useWidgetStore';
import { Clock, CloudSun, Link as LinkIcon, Activity } from 'lucide-react';
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
    {
      type: 'clock',
      title: t('clock'),
      description: t('clock_desc'),
      icon: <Clock size={24} className="text-blue-500" />,
      defaultSize: { w: 2, h: 1 },
    },
    {
      type: 'weather',
      title: t('weather'),
      description: t('weather_desc'),
      icon: <CloudSun size={24} className="text-orange-500" />,
      defaultSize: { w: 1, h: 1 },
    },
    {
      type: 'quick-link',
      title: t('quick_link'),
      description: t('quick_link_desc'),
      icon: <LinkIcon size={24} className="text-green-500" />,
      defaultSize: { w: 1, h: 1 },
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('add_widget_title')}>
      <div className="grid grid-cols-1 gap-3" role="list" aria-label={t('add_widget_title')}>
        {widgetTypes.map((widget) => (
          <button
            key={widget.type}
            onClick={() => handleAddWidget(widget.type, widget.defaultSize)}
            className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`${t('add_widget_title')} - ${widget.title}`}
          >
            <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-white transition-colors" aria-hidden="true">
              {widget.icon}
            </div>
            <div className="ml-4 flex-1">
              <h4 className="font-medium text-gray-800">{widget.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{widget.description}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
