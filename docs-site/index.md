# NaviDash 使用与配置指南

这里主要回答三个问题：如何部署 NaviDash、如何完成服务配置，以及如何在日常使用中管理组件和数据。

::: tip 第一次使用
按照“局域网部署 → 服务配置 → 日常使用”的顺序操作即可。天气与 Komari 是可选项，不配置也能
正常使用 Links、Memo、Poster 和 F1 赛程。
:::

## 第一次使用

1. 按照[局域网部署](./guide/lan-deployment)启动 Docker 容器。
2. 在另一台设备打开 `http://部署主机IP:3000`，确认局域网访问正常。
3. 按需完成[访问密码、天气和 Komari 配置](./guide/configuration)。
4. 进入组件库添加 Links、Today、Memo、Poster、F1 或 Komari。
5. 完成初始布局后，在“设置 → 数据工具”导出一次 JSON 备份。

## 按需求查找

<div class="guide-cards">
  <a class="guide-card" href="./guide/lan-deployment">
    <strong>安装并启动</strong>
    <span>Docker Compose、持久化目录、主机 IP 与防火墙</span>
  </a>
  <a class="guide-card" href="./guide/configuration">
    <strong>配置服务</strong>
    <span>访问密码、天气 API、Komari 和 Demo 模式</span>
  </a>
  <a class="guide-card" href="./guide/usage">
    <strong>开始使用</strong>
    <span>导入书签、添加组件、编辑布局和快速启动器</span>
  </a>
  <a class="guide-card" href="./guide/widgets">
    <strong>配置 Widget</strong>
    <span>每种组件的设置入口、可选项和尺寸建议</span>
  </a>
  <a class="guide-card" href="./guide/backup">
    <strong>升级与备份</strong>
    <span>安全升级、JSON 导出、目录备份与迁移</span>
  </a>
  <a class="guide-card" href="./guide/faq">
    <strong>解决问题</strong>
    <span>无法访问、修改丢失、天气和节点状态排查</span>
  </a>
</div>

## 最小配置

默认配置已经可以运行。最小部署只需要：

```bash
git clone https://github.com/wtfllix/navidash.git
cd navidash
cp .env.example .env
sudo mkdir -p /opt/navidash-data
docker compose up -d
```

同一局域网中的设备使用 `http://部署主机IP:3000` 访问。需要天气、Komari 或访问密码时，再编辑
`.env` 并重新执行 `docker compose up -d`。

## 常用入口

- [NaviDash 在线体验](https://navidash.vercel.app/zh)
- [GitHub 源码](https://github.com/wtfllix/navidash)
- [完整部署参考](https://github.com/wtfllix/navidash/blob/master/docs/DEPLOY.md)
