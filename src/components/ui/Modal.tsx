import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  overlayClassName?: string;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  overlayClassName,
  className,
  bodyClassName,
  headerClassName,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/38 p-4 backdrop-blur-sm animate-in fade-in duration-200',
        overlayClassName
      )}
    >
      <div
        ref={modalRef}
        className={cn(
          'flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[var(--radius-dialog)] border border-white/80 bg-white/[0.98] shadow-[0_24px_70px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl animate-in zoom-in-95 duration-200',
          className
        )}
      >
        <div
          className={cn(
            'flex flex-shrink-0 items-center justify-between border-b border-slate-100/80 px-6 py-4',
            headerClassName
          )}
        >
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className={cn('p-6 overflow-y-auto', bodyClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
