import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Bookmark } from '@/types';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { useToastStore } from '@/store/useToastStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { v4 as uuidv4 } from 'uuid';
import { 
  Folder, Link as LinkIcon, Globe, Server, Cpu, Wrench, PlayCircle, 
  Cloud, Database, Code, Terminal, Home, Star, Zap, Book, Image, Music, Video,
  Settings, User, Calendar, Mail, MessageSquare, ShoppingCart, Heart, Camera, Map, FileText, Monitor, Smartphone, Wifi, Lock,
  Github, Gitlab, Twitter, Instagram, Facebook, Linkedin, Youtube, Twitch, Chrome, Slack, Figma, Dribbble, Codepen, Trello,
  Gamepad, Headphones, Tv, Bitcoin, CreditCard, Wallet, ListTodo, Clock, CheckCircle, Package, Box, Container, HardDrive,
  Bot, Brain, Sparkles, Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Bookmark;
  parentId?: string; // If adding a child
  mode: 'add' | 'edit';
}

const ICON_CATEGORIES = {
  general: {
    label: '常用',
    icons: [
      { name: 'folder', icon: Folder },
      { name: 'link', icon: LinkIcon },
      { name: 'globe', icon: Globe },
      { name: 'home', icon: Home },
      { name: 'star', icon: Star },
      { name: 'zap', icon: Zap },
      { name: 'book', icon: Book },
      { name: 'settings', icon: Settings },
      { name: 'user', icon: User },
      { name: 'map', icon: Map },
      { name: 'lock', icon: Lock },
      { name: 'wifi', icon: Wifi },
    ]
  },
  dev: {
    label: '开发',
    icons: [
      { name: 'server', icon: Server },
      { name: 'cpu', icon: Cpu },
      { name: 'tool', icon: Wrench },
      { name: 'cloud', icon: Cloud },
      { name: 'database', icon: Database },
      { name: 'code', icon: Code },
      { name: 'terminal', icon: Terminal },
      { name: 'github', icon: Github },
      { name: 'gitlab', icon: Gitlab },
      { name: 'chrome', icon: Chrome },
      { name: 'figma', icon: Figma },
      { name: 'codepen', icon: Codepen },
      { name: 'disk', icon: HardDrive },
      { name: 'monitor', icon: Monitor },
      { name: 'mobile', icon: Smartphone },
    ]
  },
  ai: {
    label: 'AI',
    icons: [
      { name: 'bot', icon: Bot },
      { name: 'brain', icon: Brain },
      { name: 'sparkles', icon: Sparkles },
      { name: 'magic', icon: Wand2 },
      { name: 'cpu', icon: Cpu },
      { name: 'zap', icon: Zap },
    ]
  },
  social: {
    label: '社交',
    icons: [
      { name: 'mail', icon: Mail },
      { name: 'message', icon: MessageSquare },
      { name: 'twitter', icon: Twitter },
      { name: 'instagram', icon: Instagram },
      { name: 'facebook', icon: Facebook },
      { name: 'linkedin', icon: Linkedin },
      { name: 'youtube', icon: Youtube },
      { name: 'twitch', icon: Twitch },
      { name: 'slack', icon: Slack },
      { name: 'dribbble', icon: Dribbble },
      { name: 'heart', icon: Heart },
    ]
  },
  office: {
    label: '办公',
    icons: [
      { name: 'calendar', icon: Calendar },
      { name: 'file', icon: FileText },
      { name: 'trello', icon: Trello },
      { name: 'todo', icon: ListTodo },
      { name: 'clock', icon: Clock },
      { name: 'check', icon: CheckCircle },
      { name: 'package', icon: Package },
      { name: 'box', icon: Box },
      { name: 'container', icon: Container },
      { name: 'cart', icon: ShoppingCart },
      { name: 'bitcoin', icon: Bitcoin },
      { name: 'creditcard', icon: CreditCard },
      { name: 'wallet', icon: Wallet },
    ]
  },
  media: {
    label: '娱乐',
    icons: [
      { name: 'play', icon: PlayCircle },
      { name: 'image', icon: Image },
      { name: 'music', icon: Music },
      { name: 'video', icon: Video },
      { name: 'camera', icon: Camera },
      { name: 'gamepad', icon: Gamepad },
      { name: 'headphones', icon: Headphones },
      { name: 'tv', icon: Tv },
    ]
  }
};

export default function BookmarkModal({ isOpen, onClose, initialData, parentId, mode }: BookmarkModalProps) {
  const { addBookmark, updateBookmark } = useBookmarkStore();
  const { addToast } = useToastStore();
  const { t } = useLanguageStore();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isFolder, setIsFolder] = useState(false);
  const [icon, setIcon] = useState('link');
  const [activeCategory, setActiveCategory] = useState<keyof typeof ICON_CATEGORIES>('general');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setTitle(initialData.title);
        setUrl(initialData.url || '');
        setIsFolder(!!initialData.children);
        
        const currentIcon = initialData.icon || (initialData.children ? 'folder' : 'link');
        setIcon(currentIcon);
        
        // Find and set active category based on current icon
        const findCategory = (iconName: string): keyof typeof ICON_CATEGORIES => {
            for (const [cat, data] of Object.entries(ICON_CATEGORIES)) {
                if (data.icons.some(i => i.name === iconName)) {
                    return cat as keyof typeof ICON_CATEGORIES;
                }
            }
            return 'general';
        };
        setActiveCategory(findCategory(currentIcon));
      } else {
        setTitle('');
        setUrl('');
        setIsFolder(!!parentId); // Default to link if adding child, but can be folder
        if (!parentId) setIsFolder(true); // Default to folder if adding to root
        setIcon(parentId ? 'link' : 'folder');
        setActiveCategory('general');
      }
    }
  }, [isOpen, mode, initialData, parentId]);

  // Auto-update icon when type changes, if icon is still default
  useEffect(() => {
    if (mode === 'add') {
      if (isFolder && icon === 'link') setIcon('folder');
      if (!isFolder && icon === 'folder') setIcon('link');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFolder, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'add') {
      const newBookmark: Bookmark = {
        id: uuidv4(),
        title,
        url: isFolder ? undefined : url,
        icon: icon, 
        children: isFolder ? [] : undefined,
      };
      addBookmark(newBookmark, parentId);
      addToast(parentId ? t('bookmark_added') : t('category_added'), 'success');
    } else if (mode === 'edit' && initialData) {
      updateBookmark(initialData.id, {
        title,
        url: isFolder ? undefined : url,
        icon: icon,
      });
      addToast(t('changes_saved'), 'success');
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? t('add_bookmark') : t('edit_item')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('title')}</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {!isFolder && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('url')}</label>
            <input
              type="url"
              required={!isFolder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
        )}
        
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('icon')}</label>
            
            <div className="flex space-x-1 mb-3 overflow-x-auto pb-1">
              {(Object.keys(ICON_CATEGORIES) as Array<keyof typeof ICON_CATEGORIES>).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors",
                    activeCategory === cat 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {t(`cat_${cat}`)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1">
                {ICON_CATEGORIES[activeCategory].icons.map((item) => {
                    const IconComponent = item.icon;
                    return (
                        <button
                            key={item.name}
                            type="button"
                            onClick={() => setIcon(item.name)}
                            className={cn(
                                "p-2 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors border",
                                icon === item.name ? "bg-blue-50 border-blue-500 text-blue-600" : "border-transparent text-gray-500"
                            )}
                            title={item.name}
                        >
                            <IconComponent size={20} />
                        </button>
                    );
                })}
            </div>
        </div>

        {mode === 'add' && parentId && (
            <div className="flex items-center space-x-2 pt-2">
                <input 
                    type="checkbox" 
                    id="isFolder" 
                    checked={isFolder} 
                    onChange={(e) => setIsFolder(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isFolder" className="text-sm text-gray-700">{t('is_folder')}</label>
            </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {mode === 'add' ? t('create') : t('save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
