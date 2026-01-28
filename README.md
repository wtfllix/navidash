# NaviDash

NaviDash 是一个极简、可定制的个人导航仪表盘，专为自托管爱好者设计。

## 功能特性

- **书签管理**：支持嵌套文件夹、自定义图标以及拖拽整理。
- **小组件**：内置时钟、天气、快速链接等组件。
- **高度可定制**：基于网格布局的拖拽式界面。
- **自托管支持**：提供 Docker 支持以及持久化存储。

## 快速开始

### 前置要求

- Docker
- Docker Compose

### 部署指南

1.  **克隆仓库：**
    ```bash
    git clone https://github.com/yourusername/navidash.git
    cd navidash
    ```

2.  **使用 Docker Compose 启动：**
    ```bash
    docker-compose up -d
    ```

3.  **访问仪表盘：**
    打开浏览器并访问 `http://localhost:3000`。

### 数据持久化

应用数据存储在 `./data` 目录下。
- `bookmarks.json`：您的书签配置。
- `widgets.json`：您的小组件布局和配置。

使用 Docker Compose 运行时，该目录会被挂载到容器内的 `/app/data`，确保您的配置在重启后依然保留。

## 本地开发

1.  **安装依赖：**
    ```bash
    npm install
    ```

2.  **启动开发服务器：**
    ```bash
    npm run dev
    ```

3.  **构建生产版本：**
    ```bash
    npm run build
    npm start
    ```

## 许可证

MIT
