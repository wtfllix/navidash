import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'zh';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // General
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    'save': 'Save',
    'create': 'Create',
    'delete': 'Delete',
    'edit': 'Edit',
    'settings': 'Settings',
    'loading': 'Loading...',
    
    // Sidebar
    'add_category': 'Add Category',
    'switch_mode': 'Switch Layout Mode',
    'delete_confirm': 'Are you sure you want to delete this item?',
    'bookmark_deleted': 'Bookmark deleted',
    
    // Bookmark Modal
    'add_bookmark': 'Add Bookmark',
    'edit_item': 'Edit Item',
    'title': 'Title',
    'url': 'URL',
    'icon': 'Icon',
    'is_folder': 'Is this a folder?',
    'folder': 'Folder',
    'link': 'Link',
    'bookmark_added': 'Bookmark added',
    'category_added': 'Category added',
    'changes_saved': 'Changes saved',
    
    // Icon Categories
    'cat_general': 'General',
    'cat_dev': 'Dev',
    'cat_social': 'Social',
    'cat_office': 'Office',
    'cat_media': 'Media',
    'cat_ai': 'AI',

    // Settings Modal
    'settings_title': 'Settings & Data',
    'export_config': 'Export Configuration',
    'export_desc': 'Download a backup of your bookmarks and widgets layout.',
    'download_json': 'Download JSON Backup',
    'import_config': 'Import Configuration',
    'import_desc': 'Restore from a previously exported JSON file.',
    'select_file': 'Select Backup File',
    'backup_exported': 'Backup exported successfully',
    'config_restored': 'Configuration restored successfully',
    'import_failed': 'Failed to import: Invalid JSON file',
    'reset_defaults': 'Reset to Defaults',
    'confirm_reset': 'Click again to Confirm Reset',
    'reset_warning': 'This will wipe all current data!',
    'reset_not_implemented': 'Reset capability not fully implemented yet',
    'language': 'Language',
    'language_desc': 'Switch between English and Chinese.',
    
    // Widgets
    'widget_clock': 'Clock',
    'widget_weather': 'Weather',
    'widget_quick_link': 'Quick Link',
    'coming_soon': 'Coming Soon',
  },
  zh: {
    // General
    'cancel': '取消',
    'confirm': '确认',
    'save': '保存',
    'create': '创建',
    'delete': '删除',
    'edit': '编辑',
    'settings': '设置',
    'loading': '加载中...',
    
    // Sidebar
    'add_category': '新建分类',
    'switch_mode': '切换布局模式',
    'switch_to_fixed': '切换为固定布局',
    'switch_to_auto': '切换为自动伸缩',
    'delete_confirm': '确认要删除此项吗？',
    'bookmark_deleted': '书签已删除',
    
    // Bookmark Modal
    'add_bookmark': '添加书签',
    'edit_item': '编辑项目',
    'title': '标题',
    'url': '链接地址',
    'icon': '图标',
    'is_folder': '这是一个文件夹吗？',
    'folder': '文件夹',
    'link': '链接',
    'bookmark_added': '书签已添加',
    'category_added': '分类已添加',
    'changes_saved': '更改已保存',

    // Icon Categories
    'cat_general': '常用',
    'cat_dev': '开发',
    'cat_social': '社交',
    'cat_office': '办公',
    'cat_media': '媒体',
    'cat_ai': 'AI',

    // Settings Modal
    'settings_title': '设置与数据',
    'export_config': '导出配置',
    'export_desc': '下载包含书签和布局的备份文件。',
    'download_json': '下载 JSON 备份',
    'import_config': '导入配置',
    'import_desc': '从之前导出的 JSON 文件恢复。',
    'select_file': '选择备份文件',
    'backup_exported': '备份导出成功',
    'config_restored': '配置恢复成功',
    'import_failed': '导入失败：无效的 JSON 文件',
    'reset_defaults': '重置为默认',
    'confirm_reset': '再次点击以确认重置',
    'reset_warning': '這将清除所有当前数据！',
    'reset_not_implemented': '重置功能尚未完全实现',
    'language': '语言',
    'language_desc': '在中文和英文之间切换。',

    // Widgets
    'widget_clock': '时钟',
    'widget_weather': '天气',
    'widget_quick_link': '快捷链接',
    'coming_soon': '敬请期待',
  }
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'zh', // Default to Chinese as per user preference
      setLanguage: (lang) => set({ language: lang }),
      t: (key) => {
        const lang = get().language;
        return translations[lang][key as keyof typeof translations['en']] || key;
      },
    }),
    {
      name: 'language-storage',
    }
  )
);
