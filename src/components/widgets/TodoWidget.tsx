import React, { useState, useEffect } from 'react';
import { Widget } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoWidgetProps {
  widget: Widget;
}

export default function TodoWidget({ widget }: TodoWidgetProps) {
  const { updateWidget } = useWidgetStore();
  const [inputValue, setInputValue] = useState('');
  const t = useTranslations('Widgets');
  
  // 从 config 中获取 todos，默认为空数组
  const todos: TodoItem[] = widget.config.todos || [];

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      completed: false,
    };

    const newTodos = [...todos, newTodo];
    updateWidget(widget.id, {
      config: { ...widget.config, todos: newTodos }
    });
    setInputValue('');
  };

  const handleToggle = (todoId: string) => {
    const newTodos = todos.map(todo => 
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    );
    updateWidget(widget.id, {
      config: { ...widget.config, todos: newTodos }
    });
  };

  const handleDelete = (todoId: string) => {
    const newTodos = todos.filter(todo => todo.id !== todoId);
    updateWidget(widget.id, {
      config: { ...widget.config, todos: newTodos }
    });
  };

  return (
    <div className="flex flex-col h-full bg-white p-4 overflow-hidden">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span>✅</span> {t('todo_list')}
      </h3>
      
      <div className="flex-1 overflow-y-auto min-h-0 space-y-1 pr-1 custom-scrollbar">
        {todos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs text-center">
            <p>{t('no_todos')}</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div 
              key={todo.id} 
              className="group flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-md transition-colors"
            >
              <button
                onClick={() => handleToggle(todo.id)}
                className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  todo.completed 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                {todo.completed && <Check size={10} strokeWidth={3} />}
              </button>
              
              <span className={`flex-1 text-sm truncate ${
                todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'
              }`}>
                {todo.text}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(todo.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-3 relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t('add_todo_placeholder')}
          className="w-full pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
        />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-blue-500 hover:bg-blue-50 rounded disabled:text-gray-300 disabled:hover:bg-transparent"
        >
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
}
