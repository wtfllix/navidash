# Changelog

用于记录 NaviDash 中有意义的功能变更、问题修复、重要重构和工程性更新。

记录规则：
- 按日期分组
- 一项有意义的变更记录一条
- 优先保持简洁、可检索、可追溯

## 2026-04-10

### fix: todo 与 memo 底部滚动提示阴影
- 做了什么：为 `todo` 和 `memo` 组件的滚动内容区补充动态底部渐隐阴影，仅在下方还有未显示内容时展示，帮助用户感知还可以继续向下滚动
- 影响范围：组件可读性、滚动内容可发现性、移动端与桌面端的内容浏览体验
- 涉及模块：`src/components/widgets/TodoWidget.tsx`、`src/components/widgets/MemoWidget.tsx`
- 是否有兼容性影响：无
- 后续待补充：可继续评估是否将同类滚动提示抽成共享逻辑，统一其他长内容组件的提示行为

## 2026-04-09

### docs: 初始化变更记录规范
- 做了什么：新增 `changelog.md` 作为统一的变更记录文件，并在 `AGENTS.md` 中补充变更记录要求
- 影响范围：开发流程、任务交付规范
- 涉及模块：`AGENTS.md`、`changelog.md`
- 是否有兼容性影响：无
- 后续待补充：后续功能开发完成后，按统一模板持续补充变更记录

## 2026-04-10

### feat: 新增画布级快速打开与搜索面板
- 做了什么：在画布空闲状态下支持直接输入关键词唤起快速打开弹窗，可匹配 `quick-link` 和 `links` 组件里已保存的链接；未命中时回车会走默认搜索引擎；默认态还会展示最近搜索和最近打开的链接
- 影响范围：画布交互、链接访问效率、搜索流程一致性、本地历史记录体验
- 涉及模块：`src/components/layout/MainCanvas.tsx`、`src/components/layout/CanvasLinkLauncher.tsx`、`src/components/layout/Header.tsx`、`src/lib/linkLauncher.ts`、`src/lib/linkLauncherHistory.ts`、`src/lib/searchEngines.ts`、`messages/*.json`
- 是否有兼容性影响：无，历史记录仅保存在当前浏览器的 `localStorage`
- 后续待补充：继续补充明确快捷键入口、历史清理能力、结果排序优化，以及搜索引擎全局配置化
