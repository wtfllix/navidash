'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Widget } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useTranslations } from 'next-intl';

interface WidgetSettingsModalProps {
  widget: Widget | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WidgetSettingsModal({ widget, isOpen, onClose }: WidgetSettingsModalProps) {
  const { updateWidget } = useWidgetStore();
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [config, setConfig] = useState<Record<string, any>>({});
  const t = useTranslations('WidgetSettings');
  const tWidgets = useTranslations('Widgets');

  useEffect(() => {
    if (widget) {
      setSize(widget.size);
      setConfig(widget.config || {});
    }
  }, [widget]);

  if (!widget) return null;

  const handleSave = () => {
    updateWidget(widget.id, { size, config });
    onClose();
  };

  const renderConfigFields = () => {
    switch (widget.type) {
      case 'weather':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('city_name')}</label>
              <input
                type="text"
                value={config.city || ''}
                onChange={(e) => setConfig({ ...config, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g. Beijing"
                aria-label={tWidgets('city_name')}
              />
            </div>
             <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('latitude')}</label>
                  <input
                    type="number"
                    value={config.lat || ''}
                    onChange={(e) => setConfig({ ...config, lat: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    aria-label={tWidgets('latitude')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('longitude')}</label>
                  <input
                    type="number"
                    value={config.lon || ''}
                    onChange={(e) => setConfig({ ...config, lon: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    aria-label={tWidgets('longitude')}
                  />
                </div>
             </div>
             <p className="text-xs text-gray-500 mt-2">
               {tWidgets('find_coords')} <a href="https://open-meteo.com/" target="_blank" className="text-blue-500 underline">open-meteo.com</a>
             </p>
          </>
        );
      case 'quick-link':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('widget_title')}</label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                aria-label={tWidgets('widget_title')}
              />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">{tWidgets('widget_url')}</label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="https://..."
                aria-label={tWidgets('widget_url')}
              />
            </div>
          </>
        );
      default:
        return <p className="text-sm text-gray-500">{tWidgets('no_config')}</p>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tWidgets('title_edit', { type: widget.type })}>
      <div className="space-y-6">
        {/* Size Config */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">{tWidgets('size')}</h4>
          <div className="flex items-center space-x-4">
             <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">{tWidgets('width_cols')}</label>
                <select 
                  value={size.w}
                  onChange={(e) => setSize({ ...size, w: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value={1}>{tWidgets('size_small')}</option>
                  <option value={2}>{tWidgets('size_medium')}</option>
                  <option value={4}>{tWidgets('size_full')}</option>
                </select>
             </div>
             <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">{tWidgets('height_rows')}</label>
                <select 
                  value={size.h}
                  onChange={(e) => setSize({ ...size, h: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                >
                  <option value={1}>{tWidgets('size_standard')}</option>
                  <option value={2}>{tWidgets('size_tall')}</option>
                </select>
             </div>
          </div>
        </div>

        {/* Specific Config */}
        <div className="pt-4 border-t border-gray-100">
           <h4 className="text-sm font-medium text-gray-900 mb-3">{tWidgets('configuration')}</h4>
           {renderConfigFields()}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30"
          >
            {tWidgets('save_changes')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
