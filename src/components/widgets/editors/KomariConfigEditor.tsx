'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormField, SelectInput, SegmentedControl } from './FormControls';
import { WidgetConfigEditorProps } from './types';

interface NodeOption {
  id: string;
  name: string;
}

type NodesResponse =
  | { state: 'ok'; nodes: NodeOption[] }
  | { state: 'unconfigured' | 'unavailable'; nodes: NodeOption[] };

export default function KomariConfigEditor({
  config,
  setConfig,
}: WidgetConfigEditorProps<'komari'>) {
  const t = useTranslations('Widgets');
  const [response, setResponse] = useState<NodesResponse | null>(null);

  useEffect(() => {
    let active = true;
    void fetch('/api/komari/nodes')
      .then((result) => (result.ok ? result.json() : Promise.reject(new Error('Request failed'))))
      .then((data: NodesResponse) => {
        if (active) setResponse(data);
      })
      .catch(() => {
        if (active) setResponse({ state: 'unavailable', nodes: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const isUnavailable = response?.state === 'unavailable';
  const isUnconfigured = response?.state === 'unconfigured';

  return (
    <div className="space-y-4">
      <FormField label={t('komari_node')} hint={t('komari_node_hint')}>
        <SelectInput
          value={config.nodeId ?? ''}
          disabled={!response || isUnavailable || isUnconfigured}
          onChange={(event) =>
            setConfig((current) => ({ ...current, nodeId: event.target.value || undefined }))
          }
        >
          <option value="">
            {!response ? t('komari_nodes_loading') : t('komari_node_placeholder')}
          </option>
          {response?.nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </SelectInput>
      </FormField>

      {isUnconfigured ? <p className="text-xs leading-5 text-amber-700">{t('komari_unconfigured')}</p> : null}
      {isUnavailable ? <p className="text-xs leading-5 text-red-600">{t('komari_unavailable')}</p> : null}

      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
        <span>
          <span className="block text-sm font-medium text-slate-800">{t('komari_show_network')}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            {t('komari_show_network_hint')}
          </span>
        </span>
        <input
          type="checkbox"
          checked={config.showNetwork ?? true}
          onChange={(event) =>
            setConfig((current) => ({ ...current, showNetwork: event.target.checked }))
          }
          className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
        />
      </label>

      <FormField label={t('komari_refresh_interval')} hint={t('komari_refresh_interval_hint')}>
        <SegmentedControl
          columns={3}
          value={String(config.refreshInterval ?? 5)}
          options={[5, 15, 30].map((seconds) => ({ value: String(seconds), label: t('komari_seconds', { count: seconds }) }))}
          onChange={(value) =>
            setConfig((current) => ({ ...current, refreshInterval: Number(value) as 5 | 15 | 30 }))
          }
        />
      </FormField>
    </div>
  );
}
