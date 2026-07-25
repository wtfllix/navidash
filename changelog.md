# Changelog

用于记录 NaviDash 中有意义的功能变更、问题修复、重要重构和工程性更新。

记录规则：
- 按日期分组
- 一项有意义的变更记录一条
- 优先保持简洁、可检索、可追溯

## 2026-07-26

### refactor: Today 默认日期字体切换为 Kaushan Script
- 做了什么：以笔触更舒展、更接近签名手写感的 Kaushan Script 替换 Yellowtail，并随项目附带 Google Fonts 官方字体文件与 SIL Open Font License 1.1
- 影响范围：Today 信息面板日期视觉、字体加载和公开部署
- 涉及模块：`src/app/globals.css`、`tailwind.config.ts`、`public/fonts/`、`README*.md`
- 是否有兼容性影响：无；组件配置、字号与数据结构不变，字体加载失败时仍回退到系统手写字体
- 后续待补充：根据实际页面预览判断是否需要微调字距

### refactor: Today 默认日期字体切换为 Yellowtail
- 做了什么：将 Today 的默认手写日期字体替换为 Yellowtail，并随项目附带 Google Fonts 官方字体文件与 Apache 2.0 许可证，使公开部署和不同设备获得一致效果；针对 Yellowtail 较小的字面高度放大日期字号并收紧行高
- 影响范围：Today 信息面板日期视觉、字体加载和公开部署
- 涉及模块：`src/app/globals.css`、`tailwind.config.ts`、`public/fonts/`、`README*.md`
- 是否有兼容性影响：无；组件配置与数据结构不变，字体加载失败时仍回退到系统手写字体
- 后续待补充：无

### docs: 重写公开 README 与部署指南
- 做了什么：从用户收益出发重写 README，突出更快打开常用网站、越用越顺手、信息克制、自由布置和数据自持，并只保留最短启动命令；把配置与运维细节统一移入部署指南，补充 Compose、局域网、HTTPS、升级、备份恢复和故障排查
- 影响范围：首次了解项目、Docker 自托管、升级维护与部署排障
- 涉及模块：`README.md`、`README_EN.md`、`docs/DEPLOY.md`
- 是否有兼容性影响：无；仅更新公开说明，命令与当前 Compose、环境变量及持久化实现保持一致
- 后续待补充：获得稳定的产品截图后，可在 README 首屏增加一张实际界面预览

## 2026-07-25

### feat: Today 信息面板增加每日强调色
- 做了什么：Today 根据本地自然日从明亮的蓝、青、绿、靛与紫色板中确定性选择强调色，同一天刷新保持一致，次日自动切换；色板避开红色等警告语义，颜色仅作用于分钟、日期、顶部标识和强调天气图标
- 影响范围：Today 信息面板视觉、每日主页氛围
- 涉及模块：`src/components/widgets/TodayWidget.tsx`、`src/__tests__/TodayWidget.test.tsx`
- 是否有兼容性影响：无；不新增配置或持久化字段，时间与天气逻辑保持不变
- 后续待补充：根据实际长期使用反馈调整色板顺序与个别颜色明度

### feat: 支持批量粘贴链接到书签库
- 做了什么：新增共享的文本书签导入器，支持 Markdown 链接、纯 URL 与“标题 | URL”，实时反馈识别、已有重复和无效行；从书签 Dock 导入时只写入全局书签库，从 Links 设置导入时自动固定到当前组件
- 影响范围：书签首次录入、Links Widget 配置、批量导入反馈
- 涉及模块：`src/lib/bookmarkImport.ts`、`src/components/bookmarks/`、`src/components/widgets/editors/LinksConfigEditor.tsx`、`messages/*.json`
- 是否有兼容性影响：无；现有单条新增、Netscape HTML 导入与书签快照结构保持不变
- 后续待补充：根据真实粘贴内容评估是否需要支持 CSV、浏览器分享文本等更多格式

### refactor: 常用入口改为轻量书签架视觉
- 做了什么：移除 Links 内部渐变和重型嵌套卡片，按尺寸统一放大图标、收紧标题与间距；`1×1` 使用无底座、无描边的大图标独立 App Tile，`2×1`/`3×1` 使用横向快捷栏，`2×2` 使用双行书签架；溢出书签按当前容量纵向分页，可直接用滚轮滑动
- 影响范围：常用入口视觉层级、不同尺寸的信息密度、滚轮访问溢出书签
- 涉及模块：`src/components/widgets/LinksWidget.tsx`、`messages/*.json`、`src/__tests__/LinksWidget.test.tsx`
- 是否有兼容性影响：无；书签引用、排序、容量和启动器统计逻辑保持不变
- 后续待补充：根据实际画布预览校准极窄列宽下的图标尺寸与“更多”浮层位置

### chore: 更新网站版本至 0.7.3
- 做了什么：将网站版本从 0.7.2 提升到 0.7.3，并同步 README 版本标识与规范版本
- 影响范围：版本展示、发布识别、产品规范
- 涉及模块：`package.json`、`package-lock.json`、`README*.md`、`SPEC.md`
- 是否有兼容性影响：无；数据兼容变化由同日书签库重构条目单独说明
- 后续待补充：根据实际预览反馈继续校准书签面板与常用入口密度

### refactor: 书签库与常用入口正式分层
- 做了什么：将快照升级到 schema v2 并增加全局书签库；Dock 新增一级“书签”入口，支持搜索、新增、编辑、删除和 HTML 导入；快速启动器改为检索完整书签库，常用入口 Widget 改为按 `bookmarkIds` 选择、解除固定和排序，并按尺寸限制直接展示数量、用“更多”承接溢出内容
- 影响范围：书签资产、快速启动器、常用入口渲染与配置、浏览器书签导入、备份和旧数据迁移
- 涉及模块：`src/components/bookmarks/`、`src/components/widgets/LinksWidget.tsx`、`src/components/widgets/editors/LinksConfigEditor.tsx`、`src/lib/schemas.ts`、`src/store/useWidgetStore.ts`、`src/lib/linkLauncher.ts`
- 是否有兼容性影响：有；旧 Links 内联链接会按规范化 URL 去重并迁移到书签库，旧 Widget 保持原有顺序；新备份版本为 3，旧备份仍可导入
- 后续待补充：根据使用反馈评估书签文件夹管理、从书签拖到画布以及 Favicon 服务端缓存

### refactor: Widget 数据收敛为 revision 原子快照
- 做了什么：将桌面/手机布局与共享配置统一保存到 `widget-snapshot.json`，通过 revision 拒绝过期写入并串行化进程内保存；前端改用单一快照 API，Store 不再持久化派生 Widget；移除三组可绕过快照的旧写入 API，同时保留旧 JSON 文件的只读迁移能力
- 影响范围：Widget 加载与保存、多标签页并发保护、旧数据迁移、本地缓存结构
- 涉及模块：`src/app/api/widget-snapshot/`、`src/lib/server/storage.ts`、`src/store/useWidgetStore.ts`、`src/lib/schemas.ts`、`src/__tests__/storage.test.ts`
- 是否有兼容性影响：有；旧 `/api/widgets`、`/api/widget-layouts`、`/api/widget-configs` 不再提供，旧运行数据仍会读取并在首次新写入时迁移到原子快照
- 后续待补充：若未来支持多进程共享同一数据目录，需要把进程内写入队列升级为跨进程锁或数据库事务

### feat: 增加可选单用户访问保护
- 做了什么：新增由 `NAVIDASH_ACCESS_PASSWORD` 启用的登录页和 HttpOnly 会话 Cookie；默认保持关闭，启用后统一保护国际化页面、Widget/设置数据 API 与天气代理，并补充 Docker 和部署说明
- 影响范围：私人实例访问边界、API 访问、天气代理、部署环境变量
- 涉及模块：`src/middleware.ts`、`src/app/access/`、`src/app/api/access/`、`src/lib/access.ts`、`.env.example`、`docker-compose.yml`、`docs/DEPLOY.md`
- 是否有兼容性影响：低；未配置环境变量时行为不变，配置后现有访问者需要输入密码
- 后续待补充：如公开部署规模扩大，再评估登录限速、会话撤销和反向代理下的安全策略

### feat: 首页模板与浏览器书签导入
- 做了什么：在设置的数据区域增加空白画布、专注首页和个人墙三套模板；支持导入 Netscape Bookmark HTML，过滤非 HTTP(S) 地址、去重并限制 200 条；书签库重构后，导入结果进入全局书签库而不再铺满画布
- 影响范围：首页初始化、画布替换、浏览器迁移、Links 配置
- 涉及模块：`src/lib/homepageTemplates.ts`、`src/lib/bookmarkImport.ts`、`src/components/settings/SettingsModal.tsx`、`messages/*.json`、`src/__tests__/bookmarkImport.test.ts`
- 是否有兼容性影响：低；模板会在确认后替换当前画布，书签导入只增加链接资产，原有 JSON 备份导入继续可用
- 后续待补充：根据真实书签文件验证文件夹命名是否值得映射为分组标题，并评估“追加导入”而非替换的需求

### refactor: 落地自由画布稳定坐标与受控碰撞
- 做了什么：桌面画布固定为 8 列、手机固定为 2 列；将无限链式推动替换为最多影响四项的局部同列下推，同尺寸单组件碰撞优先交换，预览完整展示受影响组件；越界、影响范围过大或尺寸调整碰撞时拒绝并回弹；旧单数组布局改由独立迁移函数确定性转换
- 影响范围：桌面与手机布局、组件添加、画布拖动、组件尺寸调整、旧布局读取
- 涉及模块：`SPEC.md`、`docs/ROADMAP.md`、`docs/decisions/001-free-canvas-layout.md`、`src/lib/layoutEngine.ts`、`src/lib/widgetPlacement.ts`、`src/lib/widgetLayouts.ts`、`src/store/useWidgetStore.ts`、`src/components/layout/*`、`src/__tests__/widgetPlacement.test.ts`、`src/__tests__/widgetLayouts.test.ts`
- 是否有兼容性影响：有；碰撞调整被限制为可预览、同列且最多四项，不再允许无限推挤或横向漂移；旧单数组布局会在迁移边界生成双端坐标，当前双端布局不再因加载或视口变化被静默重排
- 后续待补充：将布局与配置保存收敛为带 revision 的原子快照，并继续简化 Store 派生状态

### refactor: 后台同步改为页面事件驱动
- 做了什么：移除前台页面每 5 秒一次的持续轮询，改为首次加载、页面恢复可见、窗口聚焦和网络恢复时同步；增加一秒事件合并与进行中请求保护，避免重复拉取和请求重叠
- 影响范围：Widget 布局与配置同步、全局设置同步、移动端网络与电量消耗、服务端 JSON 文件读取
- 涉及模块：`SPEC.md`、`src/components/layout/DataSyncer.tsx`、`src/__tests__/DataSyncer.test.tsx`
- 是否有兼容性影响：低；同一页面仍即时保存，其他设备的变化会在页面重新激活或网络恢复时拉取，但不再保证前台静置页面 5 秒内自动刷新
- 后续待补充：如真实使用需要持续跨设备预览，再设计统一快照版本与可选低频同步

### refactor: 收敛旧组件与天气配置边界
- 做了什么：新用户画布不再注入旧 Clock/Weather 默认组件；完整删除 Clock、Weather、Date、Quick Link、Todo、Calendar 及其编辑器、类型和翻译；移除从未实现的 `rss`、`monitor` 类型，并在读取旧数组时安全过滤所有下线项；天气 API Key、Host 与认证方式统一只从服务端环境变量读取，旧 Today 配置中的连接字段会在解析时剥离；同时清理未使用工具、字体注册、动画样式和过时文档
- 影响范围：新用户初始画布、旧数据迁移、组件运行时代码、天气配置安全边界、开发与使用文档
- 涉及模块：`SPEC.md`、`src/types/index.ts`、`src/lib/schemas.ts`、`src/lib/server/weather.ts`、`src/components/widgets/registry.tsx`、`src/store/useWidgetStore.ts`、`messages/`、`docs/`
- 是否有兼容性影响：有；下线组件不再渲染，旧布局与备份中的对应项会被过滤，其他有效组件继续导入；客户端传入的旧天气 Host 和认证方式不再生效
- 后续待补充：如用户需要恢复下线组件内容，应从清理前备份中手动提取；后续迁移只围绕四类当前组件维护

### feat: 全局天气服务状态入口
- 做了什么：在全局设置中新增天气服务区域，展示不含密钥的服务商、配置状态、Host 与认证方式，提供服务端环境变量示例、状态刷新和连接测试；Today 组件继续单独管理城市与坐标
- 影响范围：天气配置可发现性、服务端密钥安全边界、天气故障排查
- 涉及模块：`src/components/settings/SettingsModal.tsx`、`src/app/api/weather/status/route.ts`、`src/lib/server/weather.ts`、`messages/*.json`、`src/__tests__/weatherServer.test.ts`
- 是否有兼容性影响：无；现有环境变量与 Widget 配置继续生效，状态接口不会返回 API Key
- 后续待补充：待访问保护与独立密钥存储具备后，再评估允许从界面录入天气密钥

### feat: Today 信息牌视觉定稿
- 做了什么：按确认稿重做 Today `2×2` 信息牌，使用轻字重无衬线双色时钟、固定英文格式的手写强调色日期与星期和独立天气信息区；移除旧编号、侧边色条与嵌套卡片
- 影响范围：Today 组件视觉层级、天气状态表达、日期与时间可读性
- 涉及模块：`src/components/widgets/TodayWidget.tsx`、`tailwind.config.ts`、`src/__tests__/TodayWidget.test.tsx`
- 是否有兼容性影响：无；天气配置和数据结构不变，原 `1×1`、`2×1` Today 布局继续使用兼容样式
- 后续待补充：结合真实画布预览继续校准极窄桌面列宽与中文日期字形

### feat: Today 2×2 瑞士信息铭牌
- 做了什么：为 Today 新增 `2×2` 铭牌布局，使用 Outfit 主时间、Inter 信息标签和 Bebas Neue 编号，加入固定强调色侧边、城市状态点、日期区与高对比天气区，并将当前双端预览和演示模板切换到该尺寸
- 影响范围：Today 视觉层级、组件默认尺寸、桌面与手机预览布局
- 涉及模块：`src/components/widgets/TodayWidget.tsx`、`src/components/widgets/registry.tsx`、`src/components/widgets/editors/shared.ts`、`src/lib/demo.ts`、`messages/*.json`、`data/widget-layouts.json`
- 是否有兼容性影响：无；原 `1×1`、`2×1` Today 继续使用紧凑布局
- 后续待补充：结合实际天气内容校准极端长城市名和不同语言下的字号

### chore: 重置本地预览为数字墙配置
- 做了什么：清空当前桌面与手机布局中的旧组件，重新配置 Today、`1×1` 单入口、`2×1` 常用入口、紧凑 Memo 和无外框 Poster，并为两端提供独立无碰撞布局
- 影响范围：当前本地运行数据、桌面预览、手机预览
- 涉及模块：`data/widget-configs.json`、`data/widget-layouts.json`
- 是否有兼容性影响：当前旧布局已从运行数据移除；清理前数据临时备份在 `/tmp/navidash-widget-*-before-wall.json`
- 后续待补充：根据预览反馈调整 Today 城市、Poster 图片和常用入口内容

### feat: 发布 0.7.2 私人数字墙核心组件
- 做了什么：新增 Today 信息面板并合并时间、日期和可降级天气；让 Links 支持 `1×1` 单入口，Memo 支持 `2×1` 紧凑形态，Poster 使用无外框表面且默认关闭轮播；组件架收敛为 Links、Today、Memo 和 Poster
- 影响范围：组件产品结构、组件商店、Widget Schema、默认演示模板、双端本地预览布局、海报播放默认值
- 涉及模块：`SPEC.md`、`docs/PRODUCT.md`、`src/components/widgets/`、`src/components/layout/CanvasWidgetItem.tsx`、`src/lib/schemas.ts`、`src/lib/demo.ts`、`src/types/index.ts`、`messages/*.json`
- 是否有兼容性影响：低；旧 Clock、Weather、Date、Quick Link、Todo 与 Calendar 继续渲染，旧 Poster 数据继续读取，但缺少显式轮播设置时将改为默认静止
- 后续待补充：将 Quick Link 与 Links 进一步迁移到统一链接库，并评估旧组件的显式迁移入口

### refactor: 更新高频组件内部视觉
- 做了什么：重做 Quick Link、Links、Todo 和 Calendar 的内部排版与交互表面，减少白框嵌套、默认蓝色控件、emoji 标题和硬分割线；为 Links 的单行模式增加紧凑间距与自适应小图标，并在当前双端布局中追加带示例内容的预览组件
- 影响范围：高频链接操作、待办扫读、日历浏览、桌面与手机本地预览布局
- 涉及模块：`src/components/widgets/QuickLinkWidget.tsx`、`src/components/widgets/LinksWidget.tsx`、`src/components/widgets/TodoWidget.tsx`、`src/components/widgets/CalendarWidget.tsx`、`data/widget-configs.json`、`data/widget-layouts.json`
- 是否有兼容性影响：无；组件配置结构保持不变，新增预览项使用独立 ID 且不覆盖已有组件
- 后续待补充：根据实际预览反馈校准图标尺寸、信息密度与小组件状态

### refactor: 统一组件表面视觉层级
- 做了什么：为所有画布 Widget 统一中等圆角、无外描边的轻量表面阴影和编辑态反馈，并同步拖拽预览与接近实色的通用弹窗层级，使组件与底部 Dock 保持同一设计语言但不过度胶囊化
- 影响范围：首页组件视觉、编辑操作、拖拽反馈、通用弹窗
- 涉及模块：`src/app/globals.css`、`src/components/layout/CanvasWidgetItem.tsx`、`src/components/layout/DragDropProvider.tsx`、`src/components/ui/Modal.tsx`
- 是否有兼容性影响：无；仅调整视觉样式，不改变 Widget 数据或交互行为
- 后续待补充：根据实际预览继续校准小尺寸组件的内边距与标题密度

### chore: 发布 0.7.1
- 做了什么：将网站版本从 0.7.0 提升至 0.7.1，收录统一快速启动入口、底部 Dock 与组件架、设置精简、双端布局备份和安全重置等阶段性变更
- 影响范围：应用版本标识、项目说明、发布路线与后续版本规划
- 涉及模块：`package.json`、`package-lock.json`、`README.md`、`README_EN.md`、`docs/ROADMAP.md`、`docs/decisions/001-free-canvas-layout.md`
- 是否有兼容性影响：低；旧设置与旧备份继续兼容，版本升级不主动改写用户数据
- 后续待补充：v0.8.0 按规范重构自由画布坐标系与碰撞行为

### refactor: 清理全局设置与移除可配置主题色
- 做了什么：移除表现不一致的主题色配置并保留固定内部强调色；删除重复手动保存、无效取消语义、CSS 背景平铺控件和历史文案，将标题与 Favicon 收入高级选项，并让重置仅操作 NaviDash 数据
- 影响范围：全局设置、设置数据结构、自动保存、恢复默认、双端布局备份
- 涉及模块：`src/components/settings/SettingsModal.tsx`、`src/store/useSettingsStore.ts`、`src/store/useWidgetStore.ts`、`src/lib/schemas.ts`、`src/types/index.ts`、`messages/*.json`
- 是否有兼容性影响：低；旧设置中的 `themeColor` 会被安全忽略，旧版 `widgets` 备份仍可导入，新备份改用布局与配置分离格式
- 后续待补充：评估将默认搜索引擎持久化到使用偏好，并继续压缩启动器学习明细的默认展示

### refactor: 统一搜索启动与组件添加入口
- 做了什么：将悬浮搜索入口、`Ctrl/⌘ + K` 和画布直接输入统一接入快速启动器，在启动器内保留搜索引擎选择；移除常驻 Header 和重复的 WidgetPicker，管理操作收敛到底部悬浮工具条，所有组件新增统一通过侧边组件库完成
- 影响范围：页面信息层级、画布可用空间、键盘启动、网页搜索、组件添加流程、全局 UI 状态
- 涉及模块：`src/components/layout/CanvasToolbar.tsx`、`src/components/layout/MainCanvas.tsx`、`src/components/layout/CanvasLinkLauncher.tsx`、`src/components/widgets/registry.tsx`、`src/store/useUIStore.ts`、`messages/*.json`
- 是否有兼容性影响：无；原有搜索引擎仍可在启动器内选择，点击添加与拖拽添加继续保留
- 后续待补充：后续将 Quick Link 与 Links 收敛到统一链接数据模型，并评估搜索引擎偏好的持久化

### feat: macOS Dock 风格工具条与单行组件架
- 做了什么：将底部工具条调整为无外描边的中性毛玻璃材质，采用图标加文字、柔和投影和激活底色表达层级，并移除浏览器焦点描边与额外状态点；同时将原左侧组件库改为工具条上方弹出的单行横向组件架，并统一去除组件架外壳描边
- 影响范围：首页视觉层级、组件浏览、组件添加与拖拽路径、手机端横向操作
- 涉及模块：`src/components/layout/CanvasToolbar.tsx`、`src/components/layout/Sidebar.tsx`、`src/components/layout/WidgetStoreSidebar.tsx`、`src/components/layout/DraggableWidgetItem.tsx`
- 是否有兼容性影响：无；组件注册、添加事件和持久化结构保持不变
- 后续待补充：结合实际组件数量评估分类筛选，并继续验证窄屏设备上的横向滚动与拖拽手感

## 2026-07-24

### feat: 新增本地自学习快速启动器
- 做了什么：为快速启动器增加链接总访问次数、输入关联和 30 天半衰期排序，统一统计 Quick Link、Links 与启动器打开行为，并支持查看、清除、备份和恢复本地学习数据
- 影响范围：画布键盘启动、链接打开排序、设置数据工具、备份导入导出
- 涉及模块：`src/lib/linkLauncher*`、`src/components/layout/*`、`src/components/widgets/*`、`src/components/settings/SettingsModal.tsx`
- 是否有兼容性影响：低；旧版最近链接会迁移为初始学习记录，旧备份缺少学习数据时按空记录处理
- 后续待补充：在单用户访问保护完成后评估可选跨设备同步

## 2026-04-27

### docs: 重写中英文 README 项目定位
- 做了什么：将中英文 README 改为更完整的项目门面，前置展示轻量自托管个人启动页定位，并补充用户分层、Core/Theme/Dev Pack 能力说明、路线图和暂不计划边界
- 影响范围：项目首页信息传达、首次访问者理解效率、后续推广与开源传播素材
- 涉及模块：`README.md`、`README_EN.md`、`changelog.md`
- 是否有兼容性影响：无
- 后续待补充：后续可继续补充高质量截图、模板展示和开发者插件落地后的示例说明

## 2026-04-22

### docs: 补充最小开发约定草案
- 做了什么：在 `AGENTS.md` 中新增一组更轻量的最小开发约定，明确最小修改、抽象边界、状态使用、测试触发条件和 UI 约束，避免继续堆叠过多流程性规范
- 影响范围：开发协作方式、代码评审判断标准、后续规范增量控制
- 涉及模块：`AGENTS.md`、`changelog.md`
- 是否有兼容性影响：无
- 后续待补充：可根据后续真实开发摩擦点，再决定是否把其中个别建议升级为更明确的仓库规则

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

### feat: 新增可交互 demo 模式环境变量开关
- 做了什么：新增内置 demo 数据与天气兜底，让前后端都可以通过环境变量切换到可交互但不持久化的 demo 模式，并在刷新后恢复为预置内容
- 影响范围：Vercel 演示部署、组件与设置持久化、服务端写接口、默认展示内容
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
