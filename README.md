# NaviDash

> 一个可定制的个人导航主页，采用洞洞板式自由布局。
> A customizable personal start page with a pegboard-inspired layout.

**中文** | [English](./README_EN.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.5.0-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed.svg)

NaviDash 面向想要把浏览器首页整理得更顺手、更耐看的用户。它以洞洞板风格为基础，提供可拖拽的网格画布、常用信息组件和本地自托管部署方式，适合作为家用设备或个人电脑上的长期主页。

在线演示: [navidash.vercel.app/zh](https://navidash.vercel.app/zh)

## 适合谁

- 想把浏览器起始页整理成自己的常用入口和信息面板
- 偏好本地部署，希望数据保存在自己的机器或 NAS 上
- 喜欢简洁界面，但仍希望保留布局和外观的可定制能力

## 当前特性

- 自由布局的 widget 画布，支持拖拽、重排和尺寸调整
- 洞洞板风格背景，支持自定义壁纸、模糊和遮罩透明度
- 内置 `Clock`、`Weather`、`Date`、`Calendar`、`Todo`、`Memo`、`Quick Link`、`Links`、`Photo Frame`
- 组件配置与布局分离持久化，便于后续迁移和演进
- 支持 JSON 导入导出，方便备份和迁移
- Docker 自托管优先，适合本地容器长期运行
- 提供只读 Demo 模式，便于在线展示

## 快速开始

### Docker 部署（推荐）

1. 克隆仓库

```bash
git clone https://github.com/wtfllix/navidash.git
cd navidash
```

2. 准备数据目录

```bash
sudo mkdir -p /opt/navidash-data
```

默认 `docker-compose.yml` 会把数据挂载到 `/opt/navidash-data`。推荐把运行数据放在仓库外，避免在升级、替换目录或误删工作区时丢失。

如需自定义路径，可以先设置：

```bash
export NAVIDASH_DATA_DIR=/your/data/path
```

3. 复制环境变量模板

```bash
cp .env.example .env
```

4. 如果需要天气组件，补充天气配置

当前版本天气服务使用的是和风天气（QWeather）。

推荐使用 `apikey`：

获取方式可以尽量简单一些：

1. 注册并登录和风天气控制台
2. 创建一个项目或应用，并启用天气相关 API
3. 在项目凭证页面生成 `API Key`，填入 `QWEATHER_API_KEY`
4. 使用和风天气提供的 API Host，填入 `QWEATHER_API_HOST`；默认可用地址是 `https://devapi.qweather.com`

如果你没有使用其他由和风天气提供的接入地址，`QWEATHER_API_HOST` 可以直接填写默认值 `https://devapi.qweather.com`。

```bash
QWEATHER_API_KEY=your_qweather_key
QWEATHER_API_HOST=https://devapi.qweather.com
QWEATHER_AUTH_TYPE=apikey
```

如果你使用 JWT：

```bash
QWEATHER_API_KEY=your_qweather_jwt
QWEATHER_API_HOST=https://devapi.qweather.com
QWEATHER_AUTH_TYPE=jwt
```

5. 启动容器

```bash
docker-compose up -d
```

6. 打开 `http://localhost:3000`

### 升级

```bash
git pull
docker-compose pull
docker-compose up -d
```

只要数据目录仍然挂载在仓库外位置，升级不会清空你的配置。

### 本地开发

```bash
npm install
cp .env.example .env
npm run dev
```

常用命令：

```bash
npm run lint
npm test
npm run build
```

## 配置说明

`.env.example` 中最重要的配置项：

- `NEXT_PUBLIC_DEMO_MODE`: 设为 `true` 时启用只读演示模式
- `QWEATHER_API_KEY`: 和风天气（QWeather）使用的 Key 或 JWT
- `QWEATHER_API_HOST`: 可选，自定义和风天气兼容 Host
- `QWEATHER_AUTH_TYPE`: `apikey` 或 `jwt`

当前版本天气请求通过服务端 `/api/weather` 代理发起，默认对接和风天气（QWeather）。推荐优先把天气相关参数放在环境变量里，而不是写进组件配置。

## 数据与持久化

运行时数据默认保存在 `/app/data`，Docker 部署时通过 volume 挂载到宿主机目录。

当前主要持久化文件包括：

- `settings.json`
- `widget-layouts.json`
- `widget-configs.json`

这些文件采用版本化 JSON 包装格式，新版本可以继续兼容迁移；旧格式也保留了读取兼容。

## 文档

- [部署说明](./docs/DEPLOY.md)
- [用户指南](./docs/USER_GUIDE.md)
- [English README](./README_EN.md)

## 演示模式

NaviDash 支持只读 Demo 模式，适合部署到 Vercel 或作为在线预览站点。

- 前端可以自由拖拽和编辑
- 刷新页面后恢复为预置内容
- 写入接口会返回只读错误，不会持久化数据

## 路线方向

当前产品方向是：

- 定制化个人导航主页
- 洞洞板风格的首页体验
- 以本地容器部署为主
- 逐步补充更适合家用和自托管场景的 widget

## 贡献

欢迎提交 Issue 和 Pull Request。

## License

MIT
