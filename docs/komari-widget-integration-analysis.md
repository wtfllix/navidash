# Komari Widget 接入可行性评估

状态：已实施，待自建实例联调  
评估日期：2026-08-26  
目标项目：[Komari](https://github.com/komari-monitor/komari)

## 1. 结论

Komari 可以接入 NaviDash，但不建议把 Komari 完整页面长期作为 iframe 嵌入。

推荐新增一个原生、只读、低干扰的 `komari` Widget，由 NaviDash 服务端代理读取
Komari API，再向浏览器返回经过校验和规范化的节点摘要。

推荐的第一版范围：

- 默认尺寸为 `2x2`。
- 每张 Widget 只展示一个选定节点的健康摘要；需要同时查看多台节点时添加多张 Widget。
- 展示 CPU、内存、磁盘和简化后的上下行速率。
- 当公开节点信息提供两位 ISO 国家代码或标准国家/地区旗帜时，在节点名称前展示对应 emoji；
  不做 IP 地理定位，也不展示未规范化的地区文本。
- 默认每 5 秒刷新一次；可选放缓到 15 或 30 秒，不接入秒级 WebSocket。
- 点击组件或节点后，在新标签页打开 Komari 完整页面。
- Komari 不可用时保留组件布局，并显示明确的降级状态。

## 2. 方案比较

| 方案 | 可行性 | 优点 | 主要问题 | 建议 |
| --- | --- | --- | --- | --- |
| iframe 嵌入 Komari 首页 | 可以尝试 | 实现快，可直接使用完整界面 | 登录 Cookie、响应头、移动端适配、滚动与拖拽冲突 | 不作为正式方案 |
| NaviDash 原生 Komari Widget | 高 | 视觉一致、数据可控、安全边界清晰 | 需要扩展 Widget Schema 和服务端代理 | 推荐 |
| 仅添加 Komari 快捷入口 | 很高 | 成本最低、无接口依赖 | 无法在首页扫读状态 | 可作为临时方案 |

## 3. Komari 提供的接入能力

Komari 当前提供了实现监控摘要所需的接口：

- `POST /api/rpc2`：推荐的 JSON-RPC 2.0 接口；Komari 后续功能和改动优先在此提供。
- `public:getNodesInformation`：获取经脱敏的节点基本信息；未认证调用会过滤隐藏节点。
- `common:getNodesLatestStatus`：一次获取一个或多个节点的最新 CPU、内存、磁盘、网络和在线状态。
- `public:getClientRecentRecords`：获取指定节点最近状态记录，仅在未来需要最近记录列表时使用。

- `GET /api/nodes`：获取节点列表和基础信息。
- `GET /api/recent/{uuid}`：获取指定节点最近一分钟的状态数据。
- `WebSocket /api/clients`：获取节点实时状态。
- 后台接口支持 Bearer API Key。
- 未登录访问时，`hidden=true` 的节点会被过滤。

状态数据包含 CPU、内存、交换分区、磁盘、负载、网络速率、连接数、运行时间和更新时间等字段。
接口和数据结构以 [Komari API 文档](https://www.komari.wiki/dev/api) 为准。

Komari 的 HTTP API 和 WebSocket 都有来源校验能力：

- [CORS 实现](https://github.com/komari-monitor/komari/blob/main/web/security/cors.go)
- [WebSocket Origin 校验](https://github.com/komari-monitor/komari/blob/main/web/api/WebSocket.go)
- [公开与管理路由](https://github.com/komari-monitor/komari/blob/main/web/router/router.go)

## 4. NaviDash 当前约束

### 4.1 产品规范

当前 `SPEC.md` 明确规定组件库只提供 Links、Today、Memo、Poster 和 F1。正式加入 Komari
会改变产品行为和组件集合，因此开发前必须先更新 `SPEC.md`，并建议新增对应的决策文档。

Komari Widget 应保持只读和低干扰，不应把远程终端、任务执行、告警管理或 Komari 管理后台
能力搬入 NaviDash。这些能力应继续通过跳转到 Komari 完成。

### 4.2 类型与持久化

NaviDash 当前使用严格的 Widget 类型、配置和布局契约：

- `WidgetType` 是 TypeScript 联合类型。
- Widget、Placement 和 Config 使用 Zod 判别联合校验。
- 桌面端与移动端分别保存 Placement。
- Widget 配置与 Placement 通过带 revision 的完整快照同步。
- 组件选择器、渲染器和尺寸预设使用统一注册表。

特别注意：`monitor` 当前属于已移除类型，读取旧快照时会被确定性过滤。新组件必须使用
`komari` 等新的明确类型名，不能复用 `monitor`。

新增类型会影响快照契约。本次按 F1 的既有先例维持 `schemaVersion: 2`：Komari 只新增判别
类型与配置字段，不改变 Snapshot、Settings 或 Backup 的外层结构。该选择只保证新版继续读取
`0.7.3` 基线，不保证旧版读取含 `komari` 的 v2 快照；直接降级运行不受支持，回退前必须恢复
旧版可读取的备份。

当前实现还有一个必须在 Komari 落地前修复的风险：旧版的 Zod 判别联合不认识新类型时会令整个
快照校验失败，而存储层目前将“快照文件不存在”和“文件存在但无法校验”都按 `null` 处理。后者
不能再回退为空快照，否则下一次保存可能覆盖用户原有数据。实现前需将其改为可识别的只读错误
状态，并添加回归测试。单纯将 `schemaVersion` 升为 v3 并不能解决旧版覆盖风险。

## 5. 推荐架构

```text
Komari Server
      |
      | server-to-server HTTP
      v
NaviDash /api/komari/status
      |
      | validated normalized response
      v
KomariWidget
```

### 5.1 服务端配置

建议新增以下环境变量：

```env
KOMARI_BASE_URL=https://komari.example.com
KOMARI_API_KEY=
```

- `KOMARI_BASE_URL` 只能由服务端环境变量配置。
- `KOMARI_API_KEY` 仅在需要访问私有站点或隐藏节点时配置。
- API Key、Session Cookie 和其他凭据不得写入 Widget 配置、快照、备份或客户端存储。
- `.env.example` 只提供变量名和说明，不填写真实凭据。

### 5.2 NaviDash 服务端代理

建议新增 `GET /api/komari/status`，以重复的 `nodeId` 查询参数接收最多 50 个节点，负责：

- 使用固定的 `KOMARI_BASE_URL` 请求 Komari。
- 校验客户端提交的节点 UUID，去重后最多保留 50 个。
- 通过普通 HTTP `POST /api/rpc2` 调用 `public:getNodesInformation` 和
  `common:getNodesLatestStatus`，后者一次传入当前可见 Widget 的全部节点 UUID。
- 校验 JSON-RPC `id`、`result` 和 `error`；绝不把上游的 RPC 错误直接返回浏览器。
- 将 Komari 响应转换为 NaviDash 自己的稳定响应结构。
- 设置请求超时、响应大小限制和可控缓存时间。
- 隐藏上游错误细节，不向浏览器返回密钥、内部地址或敏感响应头。
- 合并相同时间窗口内的重复请求，避免多个 Widget 重复访问上游。

第一版不使用 RPC2 的 WebSocket：这里的“HTTP 轮询”指对 `/api/rpc2` 的普通 POST 请求，并非
旧 REST 接口或浏览器直连 Komari。`GET /api/nodes` 与 `GET /api/recent/:uuid` 可作为针对
旧 Komari 版本的后续兼容备选，不能与主路径混用或在任意失败时静默回退。

同时新增 `GET /api/komari/open`：客户端以新标签页打开该同源地址，服务端只重定向到固定的
`KOMARI_BASE_URL`。这让 Widget 配置和状态响应不需要包含上游地址；跳转后的浏览器地址本身
仍然可见，这是打开外部完整页面不可避免的结果。

如果允许任意用户配置 Komari Host，会引入 SSRF 风险。第一版不应把 Host 放入 Widget 配置；
如果未来支持多个 Komari 实例，应使用服务端维护的实例白名单和实例 ID。

### 5.3 Widget 配置建议

第一版配置可以控制在以下范围：

```ts
interface KomariWidgetConfig {
  nodeId?: string;
  showNetwork?: boolean;
  refreshInterval?: 5 | 15 | 30;
}
```

不建议保存：

- Komari Base URL。
- API Key 或登录信息。
- 未经约束的上游请求路径。
- 完整节点状态或历史监控数据。

约束：`nodeId` 校验为单个 UUID；默认未选择、`showNetwork: true`、`refreshInterval: 5`。未选择
节点时组件展示配置引导，不自动持久化服务器默认节点。用户要查看多台节点时添加多个 Widget，
而不是在一张 `2×2` 卡中塞入多台节点。

### 5.5 NaviDash 状态响应契约

浏览器只接收以下稳定、最小化的结构；不得透传 Komari 原始响应：

```ts
interface KomariStatusesResponse {
  state: 'ok' | 'unconfigured' | 'unavailable';
  sampledAt?: string;
  nodes: Record<string, {
    id: string;
    name: string;
    regionFlag?: string;
    online: boolean;
    updatedAt?: string;
    uptimeSeconds?: number;
    cpuPercent?: number;
    memory?: { usedBytes: number; totalBytes: number; percent: number };
    disk?: { usedBytes: number; totalBytes: number; percent: number };
    network?: {
      rxBytesPerSecond: number;
      txBytesPerSecond: number;
      totalUpBytes?: number;
      totalDownBytes?: number;
      trafficLimitBytes?: number;
    };
  }>;
  missingNodeIds: string[];
}
```

数值必须为有限数并限制到展示范围；无法安全规范化的单个节点应被跳过。`unavailable` 只返回
稳定错误状态，不返回上游 URL、状态码、响应体或异常详情。

### 5.4 UI 建议

默认 `2x2` 布局展示一个节点的完整健康卡：

- 节点名称、在线状态、运行时间和最后更新时间。
- CPU、内存使用两列紧凑进度条，硬盘独占下一行并将百分比和容量放在同一标题行，避免窄卡片
  中的标签换行和容量截断。
- 可选的实时上下行速率与累计流量/额度；累计流量使用横跨卡片底部的进度条，位于最后更新时间
  上方。有明确额度时按已用/额度计算进度，无限额度使用柔和的连续渐变表示不设上限，缺失额度时
  只保留轨道，不伪造百分比。上下行速率与更新时间共用进度条下方一行，避免默认高度下内容溢出。
- 可用时展示 Ping 延迟与丢包率；缺失时显示 `—`，不得把缺失额度伪装为无限。

每张 Widget 仅绑定一个节点。要查看多台节点时，用户添加多张 Widget；不得将多张完整健康卡
压缩进同一 `2×2` Widget。

组件只负责扫读。历史图表、节点详情、远程终端和管理操作通过新标签页打开 Komari。

## 6. 为什么第一版不使用 WebSocket

Komari 支持秒级 WebSocket 数据，但 NaviDash 是注意力优先的私人主页，而不是持续停留的监控
Dashboard。CPU、瞬时流量等数据在 15～30 秒后会明显失去扫读价值，因此默认使用 5 秒 HTTP
刷新；这仍不需要浏览器直连 WebSocket。

第一版使用 HTTP 的好处：

- 不需要处理 WebSocket Origin 白名单。
- 不需要实现连接复用、重连、退避和页面隐藏后的暂停恢复。
- 可见页面由一个共享轮询器收集所有活跃节点 UUID，并以当前最短刷新间隔发起一次批量请求；
  页面隐藏时暂停，恢复可见时立即刷新，因此不会让每个 Widget 形成独立请求。
- 更容易通过服务端隐藏 Komari 地址与凭据。
- 更符合低干扰、低资源消耗的产品定位。

只有在后续确认用户确实需要近实时刷新时，才考虑由反向代理提供同源 WebSocket，并在客户端
实现单连接共享，而不是每个 Widget 单独连接。

## 7. iframe 方案的风险

iframe 可作为快速验证手段，但不建议进入正式 Widget：

- Komari 或反向代理可能设置 `X-Frame-Options` 或 CSP `frame-ancestors`。
- 跨站 iframe 中，`SameSite=Lax` 登录 Cookie 可能无法发送。
- NaviDash 为 HTTPS 而 Komari 为 HTTP 时会触发混合内容限制。
- Komari 页面自身滚动、点击会与 NaviDash 的拖拽和编辑模式冲突。
- 完整监控页面难以适配 `2x2` 或移动端两列布局。
- Komari 更新主题或页面结构后，嵌入效果可能变化。
- iframe 无法提供与 NaviDash 一致的加载、错误和空状态体验。

如果只做短期验证，应优先使用公开 Komari 页面，并确认反向代理响应头、HTTPS 和移动端行为。

## 8. 预计改动范围

正式实现预计涉及：

- 更新 `SPEC.md`。
- 新增 `docs/decisions/` 下的 Komari Widget 决策文档。
- 扩展 `src/types/index.ts` 中的 Widget 类型和配置映射。
- 扩展 `src/lib/schemas.ts` 中的 Widget、Layout 和 Config Schema。
- 新增 Komari 服务端配置与规范化逻辑。
- 新增 `src/app/api/komari/status/route.ts`。
- 新增 `src/app/api/komari/nodes/route.ts`，仅供配置器读取可选择的节点名称与 UUID。
- 新增 `src/app/api/komari/open/route.ts`。
- 新增 `src/components/widgets/KomariWidget.tsx`。
- 新增 Komari 配置编辑器。
- 更新 Widget 注册表、尺寸预设和中英文文案。
- 更新 `.env.example`。
- 增加 Schema、快照兼容、服务端代理、错误降级和组件渲染测试。
- 更新 `changelog.md`。

## 9. 验收建议

开发完成后至少验证：

- 公共 Komari 实例可以读取非隐藏节点。
- 配置 API Key 后可以按预期读取授权节点。
- 浏览器端和备份文件中不存在 API Key。
- Komari 超时、返回无效 JSON、节点离线时组件能正确降级。
- 多个 Komari Widget 不会产生不受控的高频重复请求。
- 桌面和移动布局分别保存且不会静默重排。
- 导入旧快照和 `0.7.3` 基线数据不受影响。
- 新快照的兼容与回退行为有明确测试和说明。
- `npm run lint`、`npm test` 和 `npm run build` 全部通过。

## 10. 开发前已确认的决策

- 采用原生只读 Widget，不采用 iframe 或浏览器直连 WebSocket。
- 固定单个服务端 Komari 实例，不开放客户端 Host、路径、Cookie 或凭据配置；每张 Widget 只绑定
  一个节点，主协议为 RPC2 的普通 POST，调用 `public:getNodesInformation` 与
  `common:getNodesLatestStatus`。
- Snapshot 继续使用 v2；不写入密钥或原始监控数据；`0.7.3` 基线必须保持可读。
- v2 仅表示外层结构不变，不承诺旧版直接读取新增类型；先实现“无效快照不得回退或覆盖”的
  存储保护，再允许写入 `komari` Widget。
- 以 `/api/komari/open` 承接新标签页跳转，避免在状态响应中泄露实例地址。
- 默认展示节点配置引导；每张 Widget 只选择一个节点；刷新默认 5 秒，并与同页其他 Komari
  Widget 合并请求。

## 11. 推荐开发顺序

1. 更新产品规范和兼容策略。
2. 定义 Komari Widget 配置及 NaviDash 内部状态响应结构。
3. 实现并测试服务端 Komari Client 与 API 代理。
4. 扩展 Widget Schema、注册表和配置编辑器。
5. 实现 `KomariWidget` 的加载、成功、离线和错误状态。
6. 补充快照、备份、移动布局和安全测试。
7. 更新部署说明和 `changelog.md`。
