'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, Pencil, Check, Plus, PanelLeft } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useTranslations } from 'next-intl';

const ENGINES = [
  { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'G' },
  { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'B' },
  { name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'du' },
  { name: 'GitHub', url: 'https://github.com/search?q=', icon: 'Gh' },
];


export default function Header() {
  const t = useTranslations('Header');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState(ENGINES[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isEditing, toggleEditing, openWidgetPicker, openSettings } = useUIStore();
  const { toggle: toggleSidebar, isOpen: isSidebarOpen } = useSidebarStore();


  // Handle keyboard shortcuts (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.open(`${engine.url}${encodeURIComponent(query)}`, '_blank');
      setQuery('');
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      inputRef.current?.blur();
    }
  };

  return (
    <header className="h-16 flex items-center gap-3 px-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10 transition-all">
      {/* 小组件商店侧边栏 toggle */}
      <button
        onClick={toggleSidebar}
        title={t('bookmarks')}
        aria-label={t('bookmarks')}
        aria-expanded={isSidebarOpen}
        className={`p-2 rounded-lg transition-all duration-200 border shrink-0 ${
          isSidebarOpen
            ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
            : 'text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <PanelLeft size={20} />
      </button>

      <div className="flex-1 max-w-2xl mx-auto w-full relative z-30">
        <form onSubmit={handleSearch} role="search" className="relative flex items-center bg-gray-100/50 hover:bg-gray-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-sm rounded-xl transition-all duration-200 border border-transparent focus-within:border-blue-500/30">
           <div className="relative shrink-0">
             <button
               type="button"
               onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
               className="flex items-center justify-center w-12 h-10 rounded-l-xl border-r border-gray-200/50 hover:bg-gray-200/50 transition-colors font-medium text-gray-500 text-sm"
               aria-expanded={isSearchDropdownOpen}
               aria-haspopup="listbox"
               aria-label="Select search engine"
             >
               {engine.icon}
             </button>
             
             {isSearchDropdownOpen && (
               <>
               <div className="fixed inset-0 z-10" onClick={() => setIsSearchDropdownOpen(false)} />
               <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20" role="listbox">
                 {ENGINES.map((eng) => (
                   <button
                     key={eng.name}
                     type="button"
                     onClick={() => {
                       setEngine(eng);
                       setIsSearchDropdownOpen(false);
                     }}
                     className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                     role="option"
                     aria-selected={engine.name === eng.name}
                   >
                     <span>{eng.name}</span>
                     {engine.name === eng.name && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                   </button>
                 ))}
               </div>
               </>
             )}
           </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t('search_placeholder', { engine: engine.name }) + ' (Ctrl+K)'}
            className="w-full pl-4 pr-10 py-2.5 bg-transparent rounded-r-xl text-sm focus:outline-none h-10 placeholder-gray-400 text-gray-700"
            aria-label="Search query"
          />
          <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors" aria-label="Search">
             <Search size={18} />
          </button>
        </form>

      </div>

      <div className="flex items-center space-x-2 ml-4">
        {/* Add Widget Button */}
        {isEditing && (
          <button
            onClick={openWidgetPicker}
            title={t('add_widget')}
            aria-label={t('add_widget')}
            className="p-2 rounded-lg transition-all duration-200 text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 shadow-sm"
          >
            <Plus size={20} />
          </button>
        )}

        {/* Edit Mode Toggle */}
        <button
          onClick={toggleEditing}
          title={isEditing ? t('done') : t('customize')}
          aria-label={isEditing ? t('done') : t('customize')}
          className={`p-2 rounded-lg transition-all duration-200 border ${
            isEditing 
              ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' 
              : 'text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          {isEditing ? <Check size={20} /> : <Pencil size={20} />}
        </button>

        {/* Settings Menu */}
        <div className="relative">
          <button 
            onClick={openSettings}
            title={t('settings')}
            aria-label={t('settings')}
            className="p-2 rounded-lg transition-all duration-200 border border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
