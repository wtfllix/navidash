'use client';

import React, { useState } from 'react';
import { Search, Settings, Pencil, Check, Plus } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

const ENGINES = [
  { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'G' },
  { name: 'Bing', url: 'https://www.bing.com/search?q=', icon: 'B' },
  { name: 'Baidu', url: 'https://www.baidu.com/s?wd=', icon: 'du' },
  { name: 'GitHub', url: 'https://github.com/search?q=', icon: 'Gh' },
];

export default function Header() {
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState(ENGINES[0]);
  
  const { isEditing, toggleEditing, openWidgetPicker, openSettings } = useUIStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    window.open(`${engine.url}${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10 transition-all">
      <div className="flex-1 max-w-2xl mx-auto w-full">
        <form onSubmit={handleSearch} className="relative flex items-center bg-gray-100/50 hover:bg-gray-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:shadow-sm rounded-xl transition-all duration-200 border border-transparent focus-within:border-blue-500/30">
           <div className="relative shrink-0">
             <button
               type="button"
               onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
               className="flex items-center justify-center w-12 h-10 rounded-l-xl border-r border-gray-200/50 hover:bg-gray-200/50 transition-colors font-medium text-gray-500 text-sm"
             >
               {engine.icon}
             </button>
             
             {isSearchDropdownOpen && (
               <>
               <div className="fixed inset-0 z-10" onClick={() => setIsSearchDropdownOpen(false)} />
               <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                 {ENGINES.map((eng) => (
                   <button
                     key={eng.name}
                     type="button"
                     onClick={() => {
                       setEngine(eng);
                       setIsSearchDropdownOpen(false);
                     }}
                     className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
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
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${engine.name}...`}
            className="w-full pl-4 pr-10 py-2.5 bg-transparent rounded-r-xl text-sm focus:outline-none h-10 placeholder-gray-400 text-gray-700"
          />
          <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors">
             <Search size={18} />
          </button>
        </form>
      </div>

      <div className="flex items-center space-x-2 ml-4">
        {/* Add Widget Button */}
        {isEditing && (
          <button
            onClick={openWidgetPicker}
            title="Add Widget"
            className="p-2 rounded-lg transition-all duration-200 text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 shadow-sm"
          >
            <Plus size={20} />
          </button>
        )}

        {/* Edit Mode Toggle */}
        <button
          onClick={toggleEditing}
          title={isEditing ? 'Done' : 'Customize'}
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
            title="Settings"
            className="p-2 rounded-lg transition-all duration-200 border border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
