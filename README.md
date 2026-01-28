# 🧭 NaviDash

> 一个极简、高效、高度可定制的个人导航仪表盘。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed)

**NaviDash** 专为自托管爱好者设计，旨在提供一个美观且功能强大的浏览器起始页。无论是书签管理还是信息聚合，NaviDash 都能通过其灵活的网格布局满足您的个性化需求。

---

## Demo 地址
[Navidash](https://navidash-git-demo-wtfllixs-projects.vercel.app/)

## ✨ 功能特性

- 🎨 **现代化 UI 设计**
  - 基于 Tailwind CSS 构建，拥有简洁清爽的视觉体验。
  - 响应式布局，完美适配各种屏幕尺寸。

- 📑 **强大的书签管理**
  - **无限层级**：支持书签文件夹的无限嵌套，分类整理更轻松。
  - **智能图标**：自动集成 Lucide 图标库，支持关键词智能映射。
  - **交互友好**：支持侧边栏拖拽整理与右键快捷操作。

- 🧩 **灵活的小组件系统**
  - **自由布局**：基于 Grid 的拖拽式看板，随心所欲调整组件位置与大小。
  - **丰富组件**：内置时钟、天气、搜索栏等实用组件，支持编辑模式下的可视化配置。

- ⚡ **高性能体验**
  - **极速加载**：基于 Next.js 14 App Router 架构优化。
  - **即时响应**：由 Zustand 驱动的高效全局状态管理。

- 🐳 **自托管友好**
  - **Docker 支持**：提供开箱即用的 Docker 镜像与 Compose 配置。
  - **纯文本存储**：数据以 JSON 格式存储，无需繁琐的数据库配置，备份迁移只需复制文件。

## 📸 界面预览

<img width="1920" height="869" alt="image" src="https://github.com/user-attachments/assets/7a760b5a-3514-41f8-9b70-15536af98934" />


## 🚀 快速开始

### 🐳 使用 Docker 部署（推荐）

这是最简单的运行方式，无需配置本地 Node.js 环境。

1.  **克隆仓库**
    ```bash
    git clone https://github.com/wftllix/navidash.git
    cd navidash
    ```

2.  **启动容器**
    ```bash
    docker-compose up -d
    ```

3.  **访问应用**
    打开浏览器访问 `http://localhost:3000` 即可开始使用。

### 🛠️ 本地开发

如果您想参与开发或进行二次修改：

1.  **环境准备**
    - Node.js 18+
    - npm / yarn / pnpm

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **启动开发服务器**
    ```bash
    npm run dev
    ```
    访问 `http://localhost:3000`。

4.  **构建生产版本**
    ```bash
    npm run build
    npm start
    ```

## 📂 数据存储与备份

NaviDash 采用文件系统进行数据持久化，设计简洁可靠。

| 文件名 | 用途 | 说明 |
| :--- | :--- | :--- |
| `bookmarks.json` | 书签数据 | 存储所有书签链接及文件夹层级结构 |
| `widgets.json` | 组件配置 | 存储小组件的类型、位置、尺寸及参数 |

**数据路径**：
- **Docker 环境**：映射至容器内的 `/app/data`。
- **本地环境**：位于项目根目录下的 `data/` 文件夹。

> **备份建议**：只需定期备份 `data` 目录，即可完整保存您的所有个性化配置。

## 🛠️ 技术栈

本项目基于以下优秀的开源技术构建：

- **核心框架**: [Next.js 14](https://nextjs.org/) (App Router)
- **开发语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式方案**: [Tailwind CSS](https://tailwindcss.com/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **图标资源**: [Lucide React](https://lucide.dev/)
- **布局引擎**: [React Grid Layout](https://github.com/react-grid-layout/react-grid-layout)
- **拖拽交互**: [dnd-kit](https://dndkit.com/)

## 🤝 贡献指南

我们非常欢迎社区贡献！如果您有好的想法或发现了 Bug：

1.  Fork 本仓库。
2.  创建一个新的分支 (`git checkout -b feature/AmazingFeature`)。
3.  提交您的更改 (`git commit -m 'Add some AmazingFeature'`)。
4.  推送到分支 (`git push origin feature/AmazingFeature`)。
5.  提交 Pull Request。

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源。
