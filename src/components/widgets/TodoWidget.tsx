import React, { useEffect, useRef, useState } from 'react';
import { TodoItem, WidgetOfType } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { useToastStore } from '@/store/useToastStore';
import { Plus, Trash2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { isClientDemoMode } from '@/lib/demo';

interface TodoWidgetProps {
  widget: WidgetOfType<'todo'>;
}

export default function TodoWidget({ widget }: TodoWidgetProps) {
  const { updateWidget, saveWidgetConfigs } = useWidgetStore();
  const addToast = useToastStore((state) => state.addToast);
  const [inputValue, setInputValue] = useState('');
  const [todos, setTodos] = useState<TodoItem[]>(widget.config.todos || []);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPendingSaveErrorRef = useRef(false);
  const t = useTranslations('Widgets');
  const isDemoMode = isClientDemoMode;

  useEffect(() => {
    setTodos(widget.config.todos || []);
  }, [widget.config.todos]);

  useEffect(() => {
    if (isComposerOpen) {
      inputRef.current?.focus();
    }
  }, [isComposerOpen]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const sortedTodos = [...todos].sort((a, b) => Number(a.completed) - Number(b.completed));
  const completedCount = todos.filter((todo) => todo.completed).length;
  const remainingCount = todos.length - completedCount;
  const hasCompleted = completedCount > 0;

  const queuePersist = (nextTodos: TodoItem[]) => {
    updateWidget(widget.id, {
      config: { ...widget.config, todos: nextTodos },
    });

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void saveWidgetConfigs().then((saved) => {
        if (saved) {
          hasPendingSaveErrorRef.current = false;
          return;
        }

        if (!hasPendingSaveErrorRef.current) {
          addToast('todo_save_failed', 'error');
          hasPendingSaveErrorRef.current = true;
        }
      });
      saveTimeoutRef.current = null;
    }, 500);
  };

  const handleAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      completed: false,
    };

    const newTodos = [...todos, newTodo];
    setTodos(newTodos);
    queuePersist(newTodos);
    setInputValue('');
    setIsComposerOpen(false);
  };

  const handleToggle = (todoId: string) => {
    setTodos((current) => {
      const nextTodos = current.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      );
      queuePersist(nextTodos);
      return nextTodos;
    });
  };

  const handleDelete = (todoId: string) => {
    setTodos((current) => {
      const nextTodos = current.filter((todo) => todo.id !== todoId);
      queuePersist(nextTodos);
      return nextTodos;
    });
  };

  const handleClearCompleted = () => {
    setTodos((current) => {
      const nextTodos = current.filter((todo) => !todo.completed);
      queuePersist(nextTodos);
      return nextTodos;
    });
  };

  const handleComposerClose = () => {
    setInputValue('');
    setIsComposerOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white p-4 overflow-hidden">
      <div className="mb-3">
        <h3 className="text-ui-title flex items-center gap-2 text-gray-700">
          <span>✅</span> {t('todo_list')}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-muted text-gray-400">
          <span>{t('todo_summary', { pending: remainingCount, done: completedCount })}</span>
          {hasCompleted && (
            <button
              type="button"
              onClick={handleClearCompleted}
              disabled={isDemoMode}
              className="font-normal text-gray-500 transition-colors hover:text-gray-700"
            >
              {t('todo_clear_done')}
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-gray-100 pt-2 pr-1 custom-scrollbar">
        {todos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-3 text-center text-xs text-gray-400">
            <p className="text-sm font-medium text-gray-500">{t('no_todos')}</p>
            <p className="mt-1 text-[11px] text-gray-300">{t('todo_empty_hint')}</p>
          </div>
        ) : (
          sortedTodos.map((todo) => (
            <div 
              key={todo.id} 
              className="group flex items-center gap-2.5 rounded-md py-2 pl-2.5 pr-1.5 transition-colors hover:bg-gray-50"
            >
              <button
                onClick={() => handleToggle(todo.id)}
                disabled={isDemoMode}
                className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                  todo.completed 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                {todo.completed && <Check size={10} strokeWidth={3} />}
              </button>
              
              <span className={`flex-1 text-sm font-normal leading-5 break-words ${
                todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'
              }`}>
                {todo.text}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(todo.id);
                }}
                disabled={isDemoMode}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          {hasCompleted && (
            <div className="text-ui-muted text-gray-400">
              {t('todo_progress', {
                percent: Math.round((completedCount / todos.length) * 100),
              })}
            </div>
          )}
        </div>

        {!isDemoMode && isComposerOpen ? (
          <form
            onSubmit={handleAdd}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null) && !inputValue.trim()) {
                handleComposerClose();
              }
            }}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleComposerClose();
                }
              }}
              placeholder={t('add_todo_placeholder')}
              className="min-w-0 flex-1 rounded-lg border border-gray-200 py-2 pl-3 pr-3 text-sm transition-shadow focus:border-[rgb(var(--primary-color))] focus:outline-none focus:ring-1 focus:ring-[rgba(var(--primary-color),0.22)]"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--primary-color))] text-white transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-45"
              aria-label={t('save')}
            >
              <Plus size={15} />
            </button>
          </form>
        ) : !isDemoMode ? (
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--primary-color))] text-white shadow-sm transition-transform hover:scale-[1.03]"
            aria-label={t('add_todo_placeholder')}
          >
            <Plus size={16} />
          </button>
        ) : (
          <span className="text-xs text-gray-400">Demo</span>
        )}
      </div>
    </div>
  );
}
