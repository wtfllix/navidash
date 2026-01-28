'use client';
import React from 'react';
import { useToastStore } from '@/store/useToastStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all animate-in slide-in-from-right-full",
            toast.type === 'success' && "bg-green-50 text-green-700 border border-green-200",
            toast.type === 'error' && "bg-red-50 text-red-700 border border-red-200",
            toast.type === 'info' && "bg-blue-50 text-blue-700 border border-blue-200"
          )}
        >
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.type === 'error' && <AlertCircle size={16} />}
          {toast.type === 'info' && <Info size={16} />}
          <span>{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 hover:opacity-70"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
