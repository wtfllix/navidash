# Changelog

用于记录 NaviDash 中有意义的功能变更、问题修复、重要重构和工程性更新。

记录规则：
- 按日期分组
- 一项有意义的变更记录一条
- 优先保持简洁、可检索、可追溯

## 2026-04-22

### docs: 强化 README 的最近更新展示
- 做了什么：在中英文 README 首页补充“最近更新”区块，前置展示 0.6.0 的核心变化，并增加到 `changelog.md` 的直达入口
- 影响范围：项目首页信息传达、版本更新可见性、首次访问者对当前能力的理解效率
- 涉及模块：`README.md`、`README_EN.md`、`changelog.md`
- 是否有兼容性影响：无
- 后续待补充：后续可以考虑在 README 中补充截图或按版本维护一段更精简的 release highlights

### chore: 准备 0.6.0 版本发布
- 做了什么：基于已有变更记录整理本次版本发布内容，并将项目版本号从 `0.5.0` 提升到 `0.6.0`，同步更新 README 中的版本标识
- 影响范围：版本识别、发布准备、README 展示信息
- 涉及模块：`package.json`、`README.md`、`README_EN.md`、`changelog.md`
- 是否有兼容性影响：无
- 后续待补充：创建 `v0.6.0` tag 并在 GitHub Release 中引用 2026-04-09 至 2026-04-10 的功能与修复说明

## 2026-04-10

### feat: 主线吸收 demo 模式并统一为环境变量开关
- 做了什么：将 `codex/vercel-demo` 的演示能力并回主线实现，新增内置 demo 数据与天气兜底，让前后端都通过环境变量切换到可交互但不持久化的 demo 模式
- 影响范围：Vercel 演示部署、组件与设置持久化、服务端写接口、默认展示内容、主线代码维护成本
- 涉及模块：`src/lib/demo.ts`、`src/lib/server/storage.ts`、`src/lib/server/weather.ts`、`src/store/useWidgetStore.ts`、`src/store/useSettingsStore.ts`、`src/app/api/widgets/route.ts`、`src/app/api/widget-layouts/route.ts`、`src/app/api/widget-configs/route.ts`、`src/app/api/settings/route.ts`、`src/components/layout/*`、`src/components/settings/SettingsModal.tsx`、`.env.example`、`README*.md`
- 是否有兼容性影响：低；默认不开启 demo 模式，开启后写入会变为只读且刷新恢复为预置内容
- 后续待补充：可继续把 demo 预置内容抽成可配置模板，并补充端到端验证覆盖 demo 模式下的交互流程

### fix: todo 与 memo 底部滚动提示阴影
- 做了什么：为 `todo` 和 `memo` 组件的滚动内容区补充动态底部渐隐阴影，仅在下方还有未显示内容时展示，帮助用户感知还可以继续向下滚动
- 影响范围：组件可读性、滚动内容可发现性、移动端与桌面端的内容浏览体验
- 涉及模块：`src/components/widgets/TodoWidget.tsx`、`src/components/widgets/MemoWidget.tsx`
- 是否有兼容性影响：无
- 后续待补充：可继续评估是否将同类滚动提示抽成共享逻辑，统一其他长内容组件的提示行为

## 2026-04-09

### feat: 支持桌面与手机分离布局并共享组件数据
- 做了什么：新增桌面/手机两套小组件布局存储与编辑能力，在编辑态顶部加入布局切换入口，并让手机布局可在桌面端以预览画布方式进行摆放
- 影响范围：移动端适配、布局编辑流程、组件数据同步、导入导出兼容
- 涉及模块：`src/store/useWidgetStore.ts`、`src/lib/widgetLayouts.ts`、`src/lib/server/storage.ts`、`src/app/api/widget-layouts/route.ts`、`src/components/layout/Header.tsx`、`src/components/layout/MainCanvas.tsx`、`src/components/settings/SettingsModal.tsx`
- 是否有兼容性影响：无，兼容旧版单布局数据并自动补齐手机布局
- 后续待补充：继续针对单个组件补充更细的移动端样式优化，并视需要增加布局复制/重置能力

### feat: 手机布局支持撤销与恢复会话起点
- 做了什么：为手机布局编辑新增会话级基线快照和撤销栈，支持撤销上一步变更，以及一键恢复到进入本次手机编辑前的布局
- 影响范围：手机端布局编辑、误操作恢复、布局调整安全感
- 涉及模块：`src/store/useWidgetStore.ts`、`src/components/layout/MainCanvas.tsx`、`src/components/layout/Header.tsx`、`messages/*.json`
- 是否有兼容性影响：无
- 后续待补充：后续可以继续补充多步历史上限、退出编辑前提示和“保存为新版布局”之类的轻量工作流

### fix: 修正手机布局拖拽时的滚动与跨端覆写问题
- 做了什么：为画布拖拽补充边缘自动滚动能力，并修正手机布局拖拽落位时误走全量 `widgets` 提交、导致桌面布局被覆盖的问题
- 影响范围：手机端拖拽编辑、长页面排布、双端布局隔离
- 涉及模块：`src/components/layout/useCanvasDragPreview.ts`、`src/components/layout/MainCanvas.tsx`
- 是否有兼容性影响：无
- 后续待补充：后续可以继续微调自动滚动速度曲线，并补充拖拽过程中的边缘反馈

### feat: 新增画布级快速打开与搜索面板
- 做了什么：在画布空闲状态下支持直接输入关键词唤起快速打开弹窗，可匹配 `quick-link` 和 `links` 组件里已保存的链接；未命中时回车会走默认搜索引擎；默认态还会展示最近搜索和最近打开的链接
- 影响范围：画布交互、链接访问效率、搜索流程一致性、本地历史记录体验
- 涉及模块：`src/components/layout/MainCanvas.tsx`、`src/components/layout/CanvasLinkLauncher.tsx`、`src/components/layout/Header.tsx`、`src/lib/linkLauncher.ts`、`src/lib/linkLauncherHistory.ts`、`src/lib/searchEngines.ts`、`messages/*.json`
- 是否有兼容性影响：无，历史记录仅保存在当前浏览器的 `localStorage`
- 后续待补充：继续补充明确快捷键入口、历史清理能力、结果排序优化，以及搜索引擎全局配置化

### docs: 初始化变更记录规范
- 做了什么：新增 `changelog.md` 作为统一的变更记录文件，并在 `AGENTS.md` 中补充变更记录要求
- 影响范围：开发流程、任务交付规范
- 涉及模块：`AGENTS.md`、`changelog.md`
- 是否有兼容性影响：无
- 后续待补充：后续功能开发完成后，按统一模板持续补充变更记录

### fix: 为缺失 ResizeObserver 的环境补充降级处理
- 做了什么：为画布尺寸监听和 Todo/Memo 滚动提示补充 `ResizeObserver` 可用性检测，并在 Jest 环境中增加最小 mock，避免在 CI 或不支持该 API 的环境中抛出运行时错误
- 影响范围：CI 测试稳定性、低兼容环境运行稳定性、画布局部监听逻辑
- 涉及模块：`src/lib/resizeObserver.ts`、`src/components/layout/useCanvasMetrics.ts`、`src/components/widgets/TodoWidget.tsx`、`src/components/widgets/MemoWidget.tsx`、`jest.setup.js`
- 是否有兼容性影响：无，不支持 `ResizeObserver` 时仅退化为基础滚动与首次计算能力
- 后续待补充：后续可视需要补充对应组件测试，覆盖降级路径
