---
layout: home

hero:
  name: NaviDash
  text: 把每天打开的首页，布置成自己的样子
  tagline: 个人局域网优先的自托管首页，把常用入口、时间天气和轻量信息放在一面安静的墙上。
  actions:
    - theme: brand
      text: 开始局域网部署
      link: /guide/lan-deployment
    - theme: alt
      text: 先了解日常使用
      link: /guide/usage

features:
  - icon: 🏠
    title: 数据留在自己的设备
    details: 运行在家用电脑、NAS 或小型服务器上，布局和配置保存在你指定的持久化目录。
  - icon: 🧩
    title: 轻量 Widget
    details: 常用入口、今日信息、便签、海报、F1 和 Komari，各自承担清晰的小任务。
  - icon: 📱
    title: 局域网随处访问
    details: 电脑、手机和平板连接同一网络后，使用部署主机 IP 打开同一个首页。
  - icon: 🛟
    title: 可备份、可迁移
    details: 支持应用内 JSON 备份和宿主机数据目录备份，升级前后都能保留自己的布置。
---

## 推荐阅读

<div class="tip custom-block">
  <p class="custom-block-title">第一次使用 NaviDash？</p>
  <p>先完成局域网部署，再从底部组件库添加内容。通常几分钟就可以建立一面自己的首页。</p>
</div>

<div class="vp-doc guide-cards">
  <a class="guide-card" href="./guide/lan-deployment">
    <strong>局域网部署</strong>
    <span>Docker Compose、主机 IP、环境变量和访问检查</span>
  </a>
  <a class="guide-card" href="./guide/usage">
    <strong>日常使用</strong>
    <span>组件库、编辑模式、启动器和全局设置</span>
  </a>
  <a class="guide-card" href="./guide/widgets">
    <strong>Widget 说明</strong>
    <span>六种组件的用途、尺寸和配置要点</span>
  </a>
  <a class="guide-card" href="./guide/backup">
    <strong>升级与备份</strong>
    <span>安全升级、应用备份、目录恢复和迁移</span>
  </a>
  <a class="guide-card" href="./guide/faq">
    <strong>常见问题</strong>
    <span>无法访问、修改丢失、天气和积分更新排查</span>
  </a>
</div>

## 运行方式

文档站是独立的静态站点；NaviDash 主应用仍按原有方式运行。文档站的构建不会改变主应用的
Next.js、Docker 或 Vercel 配置。

- 源码：[GitHub 仓库](https://github.com/wtfllix/navidash)
- 应用预览：[在线体验](https://navidash.vercel.app/zh)
- 项目内完整文档：[docs 目录](https://github.com/wtfllix/navidash/tree/master/docs)
