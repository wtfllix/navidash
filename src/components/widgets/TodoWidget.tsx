"use client";
import React, { useState, useEffect } from 'react';
import { Widget } from '@/types';
import { CheckSquare, Plus, X } from 'lucide-react';
import { useWidgetStore } from '@/store/useWidgetStore';

type TodoItem = { id: string; text: string; done: boolean };

export default function TodoWidget({ widget }: { widget: Widget }) {
  const { updateWidget } = useWidgetStore();
  const [items, setItems] = useState<TodoItem[]>(widget.config?.items ?? []);
  const [input, setInput] = useState('');

  useEffect(() => {
    setItems(widget.config?.items ?? []);
  }, [widget.id, widget.config?.items]);

  const persist = (list: TodoItem[]) => {
    setItems(list);
    updateWidget(widget.id, { config: { ...widget.config, items: list } });
  };

  const add = () => {
    const val = input.trim();
    if (!val) return;
    const next = [...items, { id: Math.random().toString(36).slice(2), text: val, done: false }];
    setInput('');
    persist(next);
  };

  const toggle = (id: string) => {
    persist(items.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };
  const remove = (id: string) => {
    persist(items.filter(i => i.id !== id));
  };

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center mb-2">
        <CheckSquare size={18} className="text-emerald-600" />
        <div className="ml-2 font-semibold text-gray-800">Todo</div>
      </div>
      <div className="flex mb-2">
        <input
          className="flex-1 border border-gray-200 rounded-l px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder="添加待办..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button
          className="px-3 rounded-r bg-emerald-600 text-white text-sm hover:bg-emerald-700"
          onClick={add}
          title="Add"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-auto space-y-1 pr-1">
        {items.length === 0 && <div className="text-xs text-gray-400">暂无待办</div>}
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between px-2 py-1 rounded border border-gray-200 bg-white">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} />
              <span className={"text-sm " + (item.done ? "line-through text-gray-400" : "text-gray-700")}>{item.text}</span>
            </label>
            <button className="text-gray-400 hover:text-red-500" onClick={() => remove(item.id)} title="Remove">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
