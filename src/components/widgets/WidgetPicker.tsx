import React from 'react';
import Modal from '@/components/ui/Modal';
import { useWidgetStore } from '@/store/useWidgetStore';
import { Clock, CloudSun, Link as LinkIcon, Calendar, StickyNote, CheckSquare } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface WidgetPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WidgetPicker({ isOpen, onClose }: WidgetPickerProps) {
  const { addWidget } = useWidgetStore();

  const handleAddWidget = (type: string, defaultSize: { w: number, h: number }) => {
    const newWidget = {
      id: uuidv4(),
      type: type as any,
      size: defaultSize,
      position: { x: 0, y: 0 },
      config: {},
    };
    addWidget(newWidget);
    onClose();
  };

  const widgetTypes = [
    {
      type: 'clock',
      title: 'Clock',
      description: 'Digital clock with date',
      icon: <Clock size={24} className="text-blue-500" />,
      defaultSize: { w: 2, h: 1 },
    },
    {
      type: 'weather',
      title: 'Weather',
      description: 'Current weather conditions',
      icon: <CloudSun size={24} className="text-orange-500" />,
      defaultSize: { w: 1, h: 1 },
    },
    {
      type: 'quick-link',
      title: 'Quick Link',
      description: 'Shortcut to a website',
      icon: <LinkIcon size={24} className="text-green-500" />,
      defaultSize: { w: 1, h: 1 },
    },
    {
      type: 'calendar',
      title: 'Calendar',
      description: 'Monthly calendar view',
      icon: <Calendar size={24} className="text-indigo-500" />,
      defaultSize: { w: 2, h: 2 },
    },
    {
      type: 'memo',
      title: 'Memo',
      description: 'Simple sticky note',
      icon: <StickyNote size={24} className="text-yellow-500" />,
      defaultSize: { w: 2, h: 2 },
    },
    {
      type: 'todo',
      title: 'Todo',
      description: 'Lightweight todo list',
      icon: <CheckSquare size={24} className="text-emerald-500" />,
      defaultSize: { w: 2, h: 2 },
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Widget">
      <div className="grid grid-cols-1 gap-3">
        {widgetTypes.map((widget) => (
          <button
            key={widget.type}
            onClick={() => handleAddWidget(widget.type, widget.defaultSize)}
            className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
          >
            <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
              {widget.icon}
            </div>
            <div className="ml-4 flex-1">
              <h4 className="font-medium text-gray-800">{widget.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{widget.description}</p>
            </div>
            {/* <div className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
                {widget.defaultSize.w}x{widget.defaultSize.h}
            </div> */}
          </button>
        ))}
      </div>
    </Modal>
  );
}
