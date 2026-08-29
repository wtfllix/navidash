# 🛠️ Navidash 项目开发指令文档

> 此文件保留早期项目背景，不再作为当前产品或实现规范。当前产品愿景见
> [`PRODUCT.md`](./PRODUCT.md)，行为规范见 [`../SPEC.md`](../SPEC.md)，开发顺序见
> [`ROADMAP.md`](./ROADMAP.md)。
## 1. 项目概览
Navidash 是一个为 Docker 部署设计的个人导航仪表盘。

核心愿景： 极简、高效、可高度自定义。

设计风格： 简约生产力风格（类似 Notion / Raycast），白底、细边框、毛玻璃效果。

目标用户： 自建服务爱好者（Homelab 用户）。

## 2. 技术栈架构
框架： Next.js 14+ (App Router), TypeScript.

样式： Tailwind CSS.

图标： Lucide React.

状态管理： Zustand (处理 UI 状态与本地配置缓存)。

数据持久化： * 初期：浏览器 LocalStorage + 导出 JSON。

进阶：后端 Node.js + SQLite (数据存放在 /data 目录以便 Docker 挂载)。

## 3. 核心功能规范
### A. 布局结构 (Layout)
Sidebar (侧边栏): * 固定宽度 200px，支持点击折叠（收缩至 64px）。

嵌套书签： 支持无限层级的文件夹结构。

Header (顶栏): * 高度 56px (h-14)，毛玻璃背景。

包含：全局搜索框、服务器状态（CPU/内存）、编辑模式切换按钮。

Main Canvas (主区域): * 12 列响应式网格系统。

小组件支持预设尺寸（1x1, 2x1, 2x2, 4x2）。

### B. 数据模型 (Data Schema)

当前组件类型和配置必须以 `src/types/index.ts` 与 `src/lib/schemas.ts` 为准。组件库主推
`today`、`links`、`memo`、`photo-frame`、`f1`。旧版 `weather`、`clock`、`date`、
`quick-link`、`todo`、`calendar` 已移除，读取旧数据时会过滤。天气 API Key、Host 和
认证方式属于服务端环境配置，不得写入 widget config、导入导出文件或客户端状态。
## 4. 目录结构约定
Plaintext
/src/app/          # 路由与 API
/src/components/   # 组件 (layout/, widgets/, ui/, settings/)
/src/store/        # Zustand stores
/src/types/        # TS 类型定义
/src/lib/          # 工具类 (db.ts, utils.ts)
/data/             # Docker 挂载点
## 🤖 给 IDE AI 的初始 Prompt (可以直接复制)
“你现在是我的全栈开发助手。我们要开发一个名为 Navidash 的导航页项目。

当前任务：

请参考根目录的 PROJECT_CONTEXT.md。

首先在 src/types/index.ts 中定义书签和组件的 Interface。

然后在 src/components/layout/ 下创建 Sidebar.tsx, Header.tsx 和 MainCanvas.tsx。

实现侧边栏的折叠逻辑和嵌套书签的递归渲染。

样式请遵循极简生产力风格，使用 Tailwind CSS。”

## 5. 后续扩展计划 (Roadmap)
Widget 插件化： 支持用户通过配置页动态注入小组件。

监控组件： 编写后端接口调用 Docker Socket 或 Node Exporter 获取服务器状态。

RSS 订阅： 需要后端处理跨域并解析 XML。
