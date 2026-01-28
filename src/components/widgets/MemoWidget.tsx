"use client";
import React, { useState, useEffect } from 'react';
import { Widget } from '@/types';
import { StickyNote } from 'lucide-react';
import { useWidgetStore } from '@/store/useWidgetStore';

export default function MemoWidget({ widget }: { widget: Widget }) {
  const { updateWidget } = useWidgetStore();
  const [text, setText] = useState<string>(widget.config?.text ?? '');

  useEffect(() => {
    setText(widget.config?.text ?? '');
  }, [widget.id, widget.config?.text]); // refresh when switching widgets or external update

  const save = (val: string) => {
    updateWidget(widget.id, { config: { ...widget.config, text: val } });
  };

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center mb-2">
        <StickyNote size={18} className="text-yellow-600" />
        <div className="ml-2 font-semibold text-gray-800">Memo</div>
      </div>
      <textarea
        className="flex-1 w-full resize-none rounded border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-200 bg-yellow-50/50"
        placeholder="写点什么...（Demo 本地保存）"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => save(e.target.value)}
      />
    </div>
  );
}
