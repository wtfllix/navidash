'use client';

import React, { useMemo, useState } from 'react';
import { Check, Edit2, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { LinkItem } from '@/types';
import { useTranslations } from 'next-intl';
import { FormField, SegmentedControl, TextArea, TextInput } from './FormControls';
import { createLinkItem, getFaviconUrl, getLinkDomain, trimToUndefined } from './shared';
import { WidgetConfigEditorProps } from './types';

interface LinkDraft {
  title: string;
  url: string;
}

const emptyDraft: LinkDraft = {
  title: '',
  url: '',
};

function normalizeDraft(draft: LinkDraft) {
  const url = draft.url.trim();
  if (!url) return null;

  return {
    title: trimToUndefined(draft.title) || getLinkDomain(url),
    url,
  };
}

function LinkDraftRow({
  draft,
  onChange,
  onConfirm,
  onCancel,
  titlePlaceholder,
  urlPlaceholder,
}: {
  draft: LinkDraft;
  onChange: (draft: LinkDraft) => void;
  onConfirm: () => void;
  onCancel: () => void;
  titlePlaceholder: string;
  urlPlaceholder: string;
}) {
  const canConfirm = Boolean(draft.url.trim());

  return (
    <div className="flex gap-1 items-center">
      <TextInput
        value={draft.title}
        onChange={(e) => onChange({ ...draft, title: e.target.value })}
        className="flex-1 text-xs px-2 py-1"
        placeholder={titlePlaceholder}
      />
      <TextInput
        value={draft.url}
        onChange={(e) => onChange({ ...draft, url: e.target.value })}
        className="flex-[2] text-xs px-2 py-1"
        placeholder={urlPlaceholder}
        onKeyDown={(e) => e.key === 'Enter' && canConfirm && onConfirm()}
        invalid={draft.url.length > 0 && !canConfirm}
      />
      <button
        type="button"
        onClick={onConfirm}
        disabled={!canConfirm}
        className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Check size={14} />
      </button>
      <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
        <X size={14} />
      </button>
    </div>
  );
}

export default function LinksConfigEditor({ config, setConfig }: WidgetConfigEditorProps<'links'>) {
  const t = useTranslations('Widgets');
  const links: LinkItem[] = config.links || [];

  const [showAdd, setShowAdd] = useState(false);
  const [newDraft, setNewDraft] = useState<LinkDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<LinkDraft>(emptyDraft);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const bulkPreviewCount = useMemo(
    () => bulkText.split('\n').map(createLinkItem).filter(Boolean).length,
    [bulkText]
  );

  const updateLinks = (next: LinkItem[]) => setConfig((current) => ({ ...current, links: next }));

  const closeAdd = () => {
    setNewDraft(emptyDraft);
    setShowAdd(false);
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditDraft(emptyDraft);
  };

  const handleAdd = () => {
    const normalized = normalizeDraft(newDraft);
    if (!normalized) return;

    updateLinks([...links, { id: crypto.randomUUID(), ...normalized }]);
    closeAdd();
  };

  const handleDelete = (id: string) => updateLinks(links.filter((link) => link.id !== id));

  const startEdit = (link: LinkItem) => {
    setEditingId(link.id);
    setEditDraft({ title: link.title, url: link.url });
  };

  const handleSaveEdit = () => {
    const normalized = normalizeDraft(editDraft);
    if (!normalized || !editingId) return;

    updateLinks(links.map((link) => (link.id === editingId ? { ...link, ...normalized } : link)));
    closeEdit();
  };

  const handleBulkImport = () => {
    const newLinks = bulkText.split('\n').map(createLinkItem).filter(Boolean) as LinkItem[];
    if (newLinks.length === 0) return;

    updateLinks([...links, ...newLinks]);
    setBulkText('');
    setShowBulk(false);
  };

  return (
    <div className="space-y-4">
      <FormField label={t('links_group_title')}>
        <TextInput
          type="text"
          value={config.title || ''}
          onChange={(e) => setConfig((current) => ({ ...current, title: e.target.value }))}
          onBlur={(e) => setConfig((current) => ({ ...current, title: trimToUndefined(e.target.value) }))}
          placeholder={t('links_group_title_placeholder')}
        />
      </FormField>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-end">
        <FormField label={t('links_icon_size')}>
          <SegmentedControl
            columns={3}
            value={config.iconSize ?? 'md'}
            onChange={(size) => setConfig((current) => ({ ...current, iconSize: size }))}
            options={[
              { value: 'sm', label: t('links_size_sm') },
              { value: 'md', label: t('links_size_md') },
              { value: 'lg', label: t('links_size_lg') },
            ]}
          />
        </FormField>

        <FormField label={t('links_show_labels')}>
          <button
            type="button"
            onClick={() =>
              setConfig((current) => ({ ...current, showLabels: !(current.showLabels ?? true) }))
            }
            className={`px-3 py-2 rounded-md border text-sm transition-colors ${
              config.showLabels ?? true
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {(config.showLabels ?? true) ? t('links_labels_on') : t('links_labels_off')}
          </button>
        </FormField>
      </div>

      <FormField label={t('links_list')} hint={t('links_count_hint', { count: links.length })}>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {links.length === 0 ? <p className="text-xs text-gray-400 py-2 text-center">{t('links_empty')}</p> : null}

          {links.map((link) =>
            editingId === link.id ? (
              <LinkDraftRow
                key={link.id}
                draft={editDraft}
                onChange={setEditDraft}
                onConfirm={handleSaveEdit}
                onCancel={closeEdit}
                titlePlaceholder={t('placeholder_title')}
                urlPlaceholder={t('placeholder_url')}
              />
            ) : (
              <div key={link.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getFaviconUrl(link.url) || ''}
                  alt=""
                  className="w-4 h-4 object-contain shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="flex-1 text-sm truncate">{link.title}</span>
                <span className="text-xs text-gray-400 truncate max-w-[8rem]">{getLinkDomain(link.url)}</span>
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(link)}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(link.id)}
                    className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {showAdd ? (
          <div className="mt-2">
            <LinkDraftRow
              draft={newDraft}
              onChange={setNewDraft}
              onConfirm={handleAdd}
              onCancel={closeAdd}
              titlePlaceholder={t('placeholder_title')}
              urlPlaceholder={t('placeholder_url')}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus size={13} /> {t('links_add')}
          </button>
        )}
      </FormField>

      <div className="border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => setShowBulk((current) => !current)}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
        >
          <ExternalLink size={12} />
          {t('links_bulk_import')}
        </button>
        {showBulk ? (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-400">
              {t('links_bulk_hint')}
              {bulkPreviewCount > 0 ? ` ${t('links_bulk_preview_count', { count: bulkPreviewCount })}` : ''}
            </p>
            <TextArea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={t('links_bulk_placeholder')}
              rows={4}
              className="text-xs font-mono resize-none"
            />
            <button
              type="button"
              onClick={handleBulkImport}
              disabled={bulkPreviewCount === 0}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('links_bulk_import_btn')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
