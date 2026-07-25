<p align="center">
  <img width="160" height="160" alt="NaviDash logo" src="https://github.com/user-attachments/assets/19ebe243-3f0c-4c48-b512-c9a98f23a0c3" />
</p>

# NaviDash

> 轻量、可自托管的个人启动页，用来组织你的日常链接、快速搜索、临时记录和开发者服务入口。<br>
> A lightweight, self-hostable start page for your links, searches, notes, and developer services.

**中文** | [English](./README_EN.md)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.7.3-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Docker](https://img.shields.io/badge/Docker-ready-2496ed.svg)

[在线演示](https://navidash.vercel.app/zh) · [部署说明](./docs/DEPLOY.md) · [用户指南](./docs/USER_GUIDE.md) · [English](./README_EN.md)

NaviDash 是一个注意力优先的个性化浏览器起始页。我希望它能让你在打开新标签页后尽快找到下一步，同时把常用链接、快速搜索、临时便签和少量日常信息组织成真正属于自己的首页。

它不会刻意往完整监控平台、RSS 阅读器或项目管理工具的方向做。那些工具已经有很多成熟选择，NaviDash 更适合做一个轻量的入口页。

## 为什么做 NaviDash

我最开始想解决的问题很简单：浏览器首页经常要么太空，要么只是一堆书签；如果想放一点待办、便签、天气、项目入口，又很容易变成很重的 dashboard。

NaviDash 想保留一点自由布局和个人化，但核心还是围绕日常使用，不追求把所有组件都塞进来。

- 常用链接和项目入口可以放在一处，不用在书签里来回找。
- 首页可以直接搜索，也可以从已保存链接里快速命中。
- 临时信息可以先记在便签里，不一定每次都打开完整文档工具。
- 支持 Docker 自托管，数据可以放在自己的机器或 NAS 上。
- 功能边界会尽量收住，避免变成另一个很重的全能面板。

## 适合谁

| 用户类型 | 你可能关心 | NaviDash 提供 |
| --- | --- | --- |
| 实用效率型 | 打开快、入口清楚、少配置 | 链接、搜索、便签、快捷打开 |
| 审美展示型 | 首页好看、有个人风格、适合长期摆放 | 壁纸、洞洞板布局、主题与可视化配置 |
| 技术自托管型 | 可部署、可控、可扩展、服务状态可见 | Docker 部署、数据持久化、面向开发者的组件方向 |

## 核心能力

### Core：日常入口

- 自由布局的 widget 画布，支持拖拽、重排和尺寸调整
- 桌面与手机双布局，分别编辑排布但共享同一套组件数据
- 组件架聚焦 `Links`、`Today`、`Memo` 和 `Poster`
- Dock 书签库集中管理链接，画布级快速启动器可搜索全部书签和最近访问记录
- 支持 JSON 导入导出，方便备份和迁移

### Theme：个人首页

- 洞洞板风格背景
- 自定义壁纸、模糊和遮罩透明度
- `Today` 统一呈现时间、英文日期和天气，`Poster` 用于无边框海报装饰
- 已下线的旧组件不会进入当前运行代码；读取旧布局或备份时会过滤对应项并保留其他有效组件
- 适合做成浏览器起始页、个人主页或家用设备首页

### Dev Pack：开发者与自托管方向

这些是后续比较想做的技术向扩展。它们更像是“首页上顺手看一眼”的信息，不会一开始就做成完整运维系统。

- 本机 / 局域网 IP、公网 IP 与一键复制
- 服务状态检测，例如 `localhost:3000`、VPS、API health endpoint
- 端口快捷入口，例如 `3000`、`5432`、`6379`、`8080`
- 轻量 Docker 服务状态和端口链接

## 最近更新

当前版本：`0.7.3`

- 页面收敛为快速启动器、底部 Dock 和稳定自由画布
- 全局书签库支持 HTML 与 Markdown 批量导入，Links 固定少量常用入口
- Today、Links、Memo 和 Poster 构成当前私人数字墙核心组件
- Widget 数据统一为带 revision 的原子快照，并增加可选单用户访问保护

完整变更记录见 [changelog.md](./changelog.md)。

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

4. 如果需要 Today 显示天气，补充天气服务配置

当前版本天气服务使用和风天气（QWeather）。推荐使用 `apikey`：

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

- `NEXT_PUBLIC_DEMO_MODE`：设为 `true` 时启用只读演示模式
- `DEMO_MODE`：设为 `true` 时在服务端启用 Demo 数据和只读写入保护
- `NAVIDASH_ACCESS_PASSWORD`：可选的单用户访问密码，留空表示关闭保护
- `QWEATHER_API_KEY`：和风天气（QWeather）使用的 Key 或 JWT
- `QWEATHER_API_HOST`：可选，自定义和风天气兼容 Host
- `QWEATHER_AUTH_TYPE`：`apikey` 或 `jwt`

当前版本天气请求通过服务端 `/api/weather` 代理发起，默认对接和风天气（QWeather）。API Key、Host 和认证方式只从服务端环境变量读取；组件配置只保存城市或经纬度。

## 数据与持久化

运行时数据默认保存在 `/app/data`，Docker 部署时通过 volume 挂载到宿主机目录。

当前主要持久化文件包括：

- `settings.json`
- `widget-snapshot.json`

Widget 布局与配置通过带 revision 的原子快照一起保存。旧
`widgets.json`、`widget-layouts.json` 和 `widget-configs.json` 仍可作为迁移来源读取。

## 演示模式

NaviDash 支持只读 Demo 模式，适合部署到 Vercel 或作为在线预览站点。

- 前端可以自由拖拽和编辑
- 刷新页面后恢复为预置内容
- 写入接口会返回只读错误，不会持久化数据
- 推荐同时设置 `DEMO_MODE=true` 和 `NEXT_PUBLIC_DEMO_MODE=true`

## 文档

- [部署说明](./docs/DEPLOY.md)
- [用户指南](./docs/USER_GUIDE.md)
- [变更记录](./changelog.md)
- [English README](./README_EN.md)

## 贡献

欢迎提交 Issue 和 Pull Request。特别欢迎围绕真实使用场景的建议：链接组织、搜索工作流、便签体验、模板和自托管场景。

## License

MIT
