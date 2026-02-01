/**
 * Bookmark Interface
 * 定义书签节点结构，支持无限层级嵌套
 */
export interface Bookmark {
  id: string; // 唯一标识符
  title: string; // 显示标题
  url?: string; // 链接地址（文件夹节点可为空）
  icon?: string; // 图标名称（对应 Lucide 图标库）
  color?: string; // 自定义颜色（可选）
  children?: Bookmark[]; // 子节点列表（实现树形结构）
}

/**
 * Widget Interface
 * 定义桌面小组件结构
 */
export interface Widget {
  id: string; // 唯一标识符
  type: 'weather' | 'clock' | 'rss' | 'monitor' | 'quick-link' | 'calendar' | 'memo' | 'todo' | 'photo-frame' | 'date'; // 组件类型
  size: { w: number; h: number }; // 组件尺寸（Grid Layout 单位）
  position: { x: number; y: number }; // 组件位置（Grid Layout 坐标）
  config: Record<string, any>; // 组件专属配置（如城市、API Key、字体等）
}
