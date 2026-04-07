'use client';

import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Widget, WidgetConfig, WidgetSize } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useTranslations } from 'next-intl';
import { SelectInput } from './editors/FormControls';
import {
  getAllowedSizePresets,
  getDefaultAllowedSize,
  getSizePresetKey,
  SIZE_PRESETS,
} from './editors/shared';
import { widgetConfigEditors } from './editors/registry';
import { ConfigUpdate, EditableWidgetType } from './editors/types';

interface WidgetSettingsModalProps {
  widget: Widget | null;
  isOpen: boolean;
  onClose: () => void;
}

function applyConfigUpdate(current: WidgetConfig, update: ConfigUpdate<WidgetConfig>) {
  return typeof update === 'function' ? update(current) : update;
}

export default function WidgetSettingsModal({
  widget,
  isOpen,
  onClose,
}: WidgetSettingsModalProps) {
  const { updateWidget, saveWidgetConfigs } = useWidgetStore();
  const [size, setSize] = useState<WidgetSize>({ w: 1, h: 1 });
  const [config, setConfig] = useState<WidgetConfig>({});
  const t = useTranslations('Widgets');

  useEffect(() => {
    if (!widget) return;
    const presetKey = getSizePresetKey(widget.size);
    const allowedPresets = getAllowedSizePresets(widget.type);
    const isAllowed = presetKey ? allowedPresets.some((preset) => preset.key === presetKey) : false;
    setSize(isAllowed ? widget.size : getDefaultAllowedSize(widget.type));
    setConfig(widget.config || {});
  }, [widget]);

  if (!widget) return null;

  const initialPresetKey = getSizePresetKey(widget.size);
  const initialSize =
    initialPresetKey &&
    getAllowedSizePresets(widget.type).some((preset) => preset.key === initialPresetKey)
      ? widget.size
      : getDefaultAllowedSize(widget.type);
  const initialConfig = widget.config || {};
  const isDirty =
    JSON.stringify(size) !== JSON.stringify(initialSize) ||
    JSON.stringify(config) !== JSON.stringify(initialConfig);

  const handleConfigChange = (update: ConfigUpdate<WidgetConfig>) => {
    setConfig((current) => applyConfigUpdate(current, update));
  };

  const handleSave = async () => {
    if (!isDirty) {
      onClose();
      return;
    }

    updateWidget(widget.id, { size, config });
    await saveWidgetConfigs();
    onClose();
  };

  const renderEditor = () => {
    if (widget.type === 'clock') {
      const ClockEditor = widgetConfigEditors.clock;
      return <ClockEditor config={config as never} setConfig={handleConfigChange as never} setSize={setSize} />;
    }

    if (widget.type === 'weather') {
      return <p className="text-sm text-gray-500">{t('weather_settings_moved')}</p>;
    }

    const GenericEditor = widgetConfigEditors[widget.type as Exclude<EditableWidgetType, 'clock'>];
    return GenericEditor ? (
      <GenericEditor config={config as never} setConfig={handleConfigChange as never} />
    ) : (
      <p className="text-sm text-gray-500">{t('no_config')}</p>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('title_edit', { type: widget.type })}>
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">{t('size')}</h4>
          <label className="text-xs text-gray-500 block mb-1">{t('size')}</label>
          <SelectInput
            value={getSizePresetKey(size) ?? getAllowedSizePresets(widget.type)[0].key}
            onChange={(e) => {
              const preset = SIZE_PRESETS[e.target.value as keyof typeof SIZE_PRESETS];
              setSize({ w: preset.w, h: preset.h });
            }}
          >
            {getAllowedSizePresets(widget.type).map((preset) => (
              <option key={preset.key} value={preset.key}>
                {t(preset.labelKey)}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">{t('configuration')}</h4>
          {renderEditor()}
        </div>

        <div className="flex justify-end pt-4">
          <div className="mr-auto flex items-center text-xs text-gray-400">
            {isDirty ? t('widget_unsaved') : t('widget_saved')}
          </div>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('save_changes')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
