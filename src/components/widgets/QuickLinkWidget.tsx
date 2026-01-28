import React, { useState } from 'react';
import { Widget } from '@/types';
import { useWidgetStore } from '@/store/useWidgetStore';
import { ExternalLink, Edit2, Check, X } from 'lucide-react';

export default function QuickLinkWidget({ widget }: { widget: Widget }) {
  const { updateWidget } = useWidgetStore();
  const [isEditing, setIsEditing] = useState(!widget.config?.url);
  const [title, setTitle] = useState(widget.config?.title || '');
  const [url, setUrl] = useState(widget.config?.url || '');

  const handleSave = () => {
    if (title && url) {
      updateWidget(widget.id, {
        config: { ...widget.config, title, url }
      });
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col h-full w-full p-4 space-y-3">
        <div className="text-xs font-bold uppercase text-gray-400">Configure Link</div>
        <input
          type="text"
          placeholder="Title (e.g., Google)"
          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="URL (https://...)"
          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex space-x-2 mt-auto">
          <button 
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-700 flex items-center justify-center space-x-1"
          >
            <Check size={12} /> <span>Save</span>
          </button>
          {widget.config?.url && (
             <button 
                onClick={() => setIsEditing(false)}
                className="px-3 bg-gray-100 text-gray-600 text-xs py-1.5 rounded hover:bg-gray-200"
             >
                <X size={12} />
             </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative group w-full h-full flex flex-col items-center justify-center p-4">
      <button 
        onClick={() => setIsEditing(true)}
        className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 text-gray-500"
      >
        <Edit2 size={12} />
      </button>
      
      <a 
        href={widget.config?.url} 
        target="_blank" 
        rel="noreferrer"
        className="flex flex-col items-center justify-center space-y-3 group-hover:scale-105 transition-transform"
      >
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
           {/* We could use a favicon fetcher here later */}
           <ExternalLink size={24} />
        </div>
        <span className="font-medium text-gray-700 text-sm">{widget.config?.title}</span>
      </a>
    </div>
  );
}
