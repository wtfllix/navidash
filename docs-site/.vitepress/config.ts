import { defineConfig } from 'vitepress';

const base = process.env.GITHUB_ACTIONS ? '/navidash/' : '/';

export default defineConfig({
  title: 'NaviDash 文档',
  description: 'NaviDash 个人局域网部署与使用指南',
  lang: 'zh-CN',
  base,
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    siteTitle: 'NaviDash 文档',
    nav: [
      { text: '首页', link: '/' },
      { text: '部署', link: '/guide/lan-deployment' },
      { text: '配置', link: '/guide/configuration' },
      { text: '使用', link: '/guide/usage' },
      { text: 'GitHub', link: 'https://github.com/wtfllix/navidash' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '快速开始',
          items: [
            { text: '局域网部署', link: '/guide/lan-deployment' },
            { text: '服务配置', link: '/guide/configuration' },
            { text: '日常使用', link: '/guide/usage' },
            { text: 'Widget 说明', link: '/guide/widgets' },
          ],
        },
        {
          text: '维护与排障',
          items: [
            { text: '升级与备份', link: '/guide/backup' },
            { text: '常见问题', link: '/guide/faq' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
      label: '本页内容',
    },
    editLink: {
      pattern: 'https://github.com/wtfllix/navidash/edit/master/docs-site/:path',
      text: '在 GitHub 上编辑此页',
    },
    lastUpdated: {
      text: '最后更新',
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    socialLinks: [{ icon: 'github', link: 'https://github.com/wtfllix/navidash' }],
    footer: {
      message: 'NaviDash · 个人局域网优先的自托管首页',
      copyright: 'Released under the MIT License.',
    },
  },
});
