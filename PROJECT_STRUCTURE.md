# 项目代码结构说明 (Project Structure)

本文档旨在帮助开发者快速理解 **Navidash** 的项目结构、核心模块及各文件的作用。

## 目录结构总览

```
src/
├── app/                  # Next.js App Router 路由入口
├── components/           # React UI 组件库
│   ├── layout/           # 核心布局组件 (Header, Sidebar, MainCanvas)
│   ├── settings/         # 设置相关组件
│   ├── ui/               # 通用基础 UI 组件 (Modal, Toast)
│   └── widgets/          # 桌面小组件实现 (Clock, Weather)
├── lib/                  # 工具函数与服务端逻辑
├── store/                # Zustand 全局状态管理
├── types/                # TypeScript 类型定义
└── globals.css           # 全局样式 (Tailwind CSS)
```

## 核心模块详解

### 1. 全局状态管理 (`src/store/`)
本项目使用 **Zustand** 进行轻量级状态管理，部分 Store 结合 `persist` 中间件实现 LocalStorage 持久化。

| 文件名 | 作用 | 关键功能 |
| :--- | :--- | :--- |
| `useBookmarkStore.ts` | **书签数据管理** | 增删改查书签、递归处理树形结构、数据持久化 |
| `useSidebarStore.ts` | **侧边栏状态** | 控制侧边栏展开/收起、切换布局模式 (Push/Overlay) |
| `useWidgetStore.ts` | **小组件管理** | 管理桌面小组件的列表、位置、尺寸及配置信息 |
| `useUIStore.ts` | **全局 UI 交互** | 控制编辑模式、设置弹窗、小组件选择器的显示状态 |
| `useLanguageStore.ts` | **国际化 (i18n)** | 管理应用语言切换 (中文/English) |
| `useToastStore.ts` | **消息通知** | 管理全局 Toast 消息队列 |

### 2. 核心布局组件 (`src/components/layout/`)
负责应用的主体框架结构。

| 组件名 | 作用 |
| :--- | :--- |
| `Sidebar.tsx` | **左侧导航栏**。展示书签树，支持无限层级折叠。包含布局切换按钮。 |
| `MainCanvas.tsx` | **主内容区域**。使用 `react-grid-layout` 实现小组件的网格布局、拖拽与缩放。 |
| `Header.tsx` | **顶部状态栏**。包含搜索框、日期显示及系统状态。 |
| `DataSyncer.tsx` | **数据同步器**。无 UI 组件，负责在后台定期同步数据或处理初始化逻辑。 |

### 3. 桌面小组件 (`src/components/widgets/`)
实现了具体的小组件逻辑。所有小组件需在 `WidgetPicker.tsx` 中注册。

- `ClockWidget.tsx`: 数字时钟组件。
- `WeatherWidget.tsx`: 天气组件。
- `QuickLinkWidget.tsx`: 快捷方式组件。
- `WidgetPicker.tsx`: 小组件选择器，用于添加新组件。
- `WidgetSettingsModal.tsx`: 小组件独立配置弹窗。

### 4. 类型定义 (`src/types/index.ts`)
定义了核心数据结构，是理解数据流的关键。

- `Bookmark`: 定义书签节点，包含 `id`, `title`, `url`, `icon`, `children` (递归)。
- `Widget`: 定义小组件，包含 `id`, `type`, `size` (w/h), `position` (x/y), `config`。

### 5. API 路由 (`src/app/api/`)
Next.js 服务端路由，用于处理数据持久化请求（读写 JSON 文件）。

- `/api/bookmarks`: 处理书签数据的 GET/POST。
- `/api/widgets`: 处理小组件数据的 GET/POST。

## 开发指南

### 添加一个新的小组件
1. 在 `src/types/index.ts` 的 `Widget` 接口 `type` 字段中添加新类型。
2. 在 `src/components/widgets/` 下创建组件文件 (e.g., `NewWidget.tsx`)。
3. 在 `src/components/widgets/WidgetPicker.tsx` 中注册新组件信息。
4. 在 `src/components/layout/MainCanvas.tsx` 的 `renderContent` 函数中添加渲染分支。

### 修改侧边栏行为
- 状态逻辑位于 `src/store/useSidebarStore.ts`。
- 渲染与交互逻辑位于 `src/components/layout/Sidebar.tsx`。

### 数据持久化机制
目前采用 **JSON 文件存储** (开发环境/Docker Volume)。
- 前端通过 `saveToServer` 函数调用 API。
- 后端 API (`src/app/api/...`) 将数据写入服务器文件系统。
- `useBookmarkStore` 和 `useWidgetStore` 会在初始化时自动从 API 拉取数据。
