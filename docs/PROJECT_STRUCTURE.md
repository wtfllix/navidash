# 项目代码结构说明 (Project Structure)

本文档旨在帮助开发者快速理解 **Navidash** 的项目结构、核心模块及各文件的作用。

## 目录结构总览

```
src/
├── app/                  # Next.js App Router 路由入口
├── components/           # React UI 组件库
│   ├── layout/           # 核心布局组件 (CanvasToolbar, Sidebar, MainCanvas)
│   ├── settings/         # 设置相关组件
│   ├── ui/               # 通用基础 UI 组件 (Modal, Toast)
│   └── widgets/          # 当前四类组件及其配置界面
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
| `useSidebarStore.ts` | **组件架状态** | 控制底部组件架展开与收起 |
| `useWidgetStore.ts` | **小组件管理** | 管理组件配置以及桌面、手机布局 |
| `useUIStore.ts` | **全局 UI 交互** | 控制编辑模式、设置弹窗与快速启动器 |
| `useToastStore.ts` | **消息通知** | 管理全局 Toast 消息队列 |

### 2. 核心布局组件 (`src/components/layout/`)
负责应用的主体框架结构。

| 组件名 | 作用 |
| :--- | :--- |
| `Sidebar.tsx` | **底部组件架容器**。提供组件检索、横向浏览、点击添加和向上拖拽添加。 |
| `MainCanvas.tsx` | **主内容区域**。组合自由画布、响应式布局和快速启动器。 |
| `CanvasToolbar.tsx` | **悬浮画布工具条**。按需提供启动器、编辑模式、组件库与设置入口。 |
| `DataSyncer.tsx` | **数据同步器**。无 UI 组件，负责在后台定期同步数据或处理初始化逻辑。 |

### 3. 桌面小组件 (`src/components/widgets/`)
实现具体的小组件逻辑。组件渲染与组件库元数据统一注册在 `registry.tsx`。

- `TodayWidget.tsx`: 当前时间、英文日期与天气信息牌。
- `LinksWidget.tsx`: 单个或成组的常用入口。
- `MemoWidget.tsx`: 可直接编辑的便签。
- `PhotoWidget.tsx`: 无边框 Poster。
- 已下线组件不再保留实现；Schema 在读取旧数据时过滤对应类型。
- `registry.tsx`: 统一维护组件渲染器与组件库元数据。
- `WidgetSettingsModal.tsx`: 小组件独立配置弹窗。

### 4. 类型定义 (`src/types/index.ts`)
定义了核心数据结构，是理解数据流的关键。

- `Widget`: 定义小组件，包含 `id`, `type`, `size` (w/h), `position` (x/y), `config`。

### 5. API 路由 (`src/app/api/`)
Next.js 服务端路由，用于处理数据持久化请求（读写 JSON 文件）。

- `/api/widget-snapshot`: 原子读写布局与组件配置，并通过 revision 拒绝过期写入。
- `/api/access`: 可选单用户访问保护的状态、登录和退出接口。
- `/api/settings`: 处理全局设置。
- `/api/weather`: 使用服务端环境变量代理天气请求。
- `/api/weather/status`: 返回不包含密钥的天气配置状态，并提供连接测试。

## 开发指南

### 添加一个新的小组件
1. 在 `src/types/index.ts` 的 `Widget` 接口 `type` 字段中添加新类型。
2. 在 `src/components/widgets/` 下创建组件文件 (e.g., `NewWidget.tsx`)。
3. 在 `src/components/widgets/registry.tsx` 中注册渲染组件和组件库元数据。
4. 如需配置界面，在 `src/components/widgets/editors/registry.ts` 中注册编辑器。

### 修改侧边栏行为
- 状态逻辑位于 `src/store/useSidebarStore.ts`。
- 渲染与交互逻辑位于 `src/components/layout/Sidebar.tsx`。

### 数据持久化机制
目前采用 **JSON 文件存储** (开发环境/Docker Volume)。
- 前端通过 `saveToServer` 函数调用 API。
- 后端 API (`src/app/api/...`) 将数据写入服务器文件系统。
- `useWidgetStore` 和 `useSettingsStore` 会在初始化时从 API 拉取数据。
