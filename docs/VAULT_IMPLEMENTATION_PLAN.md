# NaviDash Vault 实施方案（讨论稿）

状态：待确认，尚未进入实施  
日期：2026-08-03  

## 1. 目标与边界

首版 Vault 定位为单用户、本机优先、私有网络可用的敏感信息管理能力。服务端只能持久化
密文，公网部署暂不在安全支持范围内。

首版支持：

- 保存、编辑、删除和搜索密码与 API Key。
- 通过统一快速启动器和 `/v` 命令访问 Vault。
- 每日首次输入主密码，并在当前页面会话内保持解锁。
- 手动锁定、空闲自动锁定和次日自动失效。
- 独立的加密备份与恢复。

首版不支持：

- 公网部署安全承诺。
- 多用户、团队共享、权限管理和云同步。
- 浏览器扩展、网页自动填充和系统级全局快捷键。
- TOTP、附件、SSH 私钥和恢复码等更多秘密类型。
- 主密码找回、跨浏览器重启免密和第三方命令插件。

## 2. 统一启动器

复用现有快速启动器的弹窗外壳，但把普通搜索、命令选择、Vault 解锁和 Vault 搜索作为
相互隔离的模式：

```ts
type LauncherMode =
  | 'search'
  | 'commands'
  | 'vault-unlock'
  | 'vault-search';
```

默认交互：

| 输入或按键 | 行为 |
| --- | --- |
| 普通字符 | 搜索书签或网页 |
| `/` | 展示可用命令 |
| `/v github` | 搜索 Vault |
| `Ctrl/Command + K` | 打开普通启动器 |
| `Ctrl/Command + Shift + K` | 直接打开 Vault 模式 |
| `Escape` | 关闭当前模式 |
| `Ctrl/Command + Shift + L` | 立即锁定 Vault |

启动器输入需要从当前的按键拼接方式调整为原生输入：

1. 画布全局监听器只负责打开启动器并传入首个字符。
2. 弹窗打开后聚焦真正的输入框。
3. 后续文本、空格、退格和光标移动交给浏览器原生输入处理。
4. 正确处理 `compositionstart`、`compositionend` 和 `event.isComposing`。
5. 主密码输入、条目编辑和秘密查看期间暂停普通启动器监听。

这样可以支持带空格的命令参数，例如 `/v github work`，也能正常使用中文输入法。

## 3. 斜杠命令

首版只实现轻量命令解析，不提前建设完整插件系统。命令描述可采用以下结构：

```ts
interface LauncherCommand {
  id: string;
  aliases: string[];
  label: string;
  sensitive: boolean;
  history: 'enabled' | 'disabled';
}
```

命令规则：

- 只有查询的第一个字符是 `/` 时才进入命令模式。
- 单独输入 `/` 时展示命令列表。
- 支持 `/vault` 完整名称和 `/v` 简写。
- 未识别命令只显示建议，不得回退到外部网页搜索。
- 敏感命令不记录历史、不做使用统计、不发送遥测。
- Vault 查询不得进入普通搜索历史、localStorage 或外部搜索引擎。
- 后续可按真实需求增加 `/b`、`/w`、`/s` 等命令。

## 4. Vault 使用流程

当天第一次使用：

```text
输入 /v github
→ 启动器进入 Vault 模式
→ 在同一弹窗外壳内显示主密码输入
→ 浏览器本地解锁
→ 恢复 github 查询
→ 展示匹配结果
```

已经解锁时：

```text
输入 /v openai
→ 展示匹配的 API Key 条目
→ Enter
→ 复制 API Key
```

结果只显示必要的安全元数据，不直接展示完整秘密：

```text
GitHub
password · user@example.com

OpenAI Production
API Key · sk-••••7X2A
```

默认操作：

- `Enter`：复制密码或 API Key。
- `Shift + Enter`：复制用户名。
- `Ctrl/Command + Enter`：打开登录地址。
- 查看完整明文必须执行额外的显式操作。
- 复制后提示用户，并在 30 秒后尽力清理剪贴板。
- 不自动请求条目网站的第三方 favicon。

## 5. 解锁与失效策略

默认策略：

- 每天第一次使用 Vault 时输入主密码。
- 解锁最长持续到部署时区的次日 `00:00`。
- 空闲 30 分钟自动锁定。
- 页面刷新、关闭或手动锁定后需要重新输入主密码。
- 设备休眠恢复、页面恢复可见和网络恢复时重新检查失效时间。
- 界面始终提供明确的 Vault 锁定状态和“立即锁定”入口。

锁定时应释放解密密钥引用，并清理 Vault 查询、结果、编辑表单和临时复制状态。JavaScript
运行时无法保证内存物理归零，因此实现只能避免继续持有和传播敏感引用。

首版不持久化任何可恢复解密能力。如果未来需要跨刷新免主密码，应单独设计基于 WebAuthn
或设备密钥的可信设备方案，不能直接把 Vault 密钥写入浏览器存储。

## 6. 加密与数据结构

Vault 不得进入 Widget Snapshot、持久化 Zustand Store 或普通 NaviDash 备份。服务端使用独立
文件，例如 `data/vault.json`，只保存加密封装：

```ts
interface EncryptedVaultFile {
  schemaVersion: number;
  revision: number;
  kdf: {
    algorithm: 'argon2id';
    salt: string;
    parameters: Record<string, number>;
  };
  wrappedDataKey: {
    iv: string;
    ciphertext: string;
  };
  payload: {
    iv: string;
    ciphertext: string;
  };
  updatedAt: string;
}
```

客户端解密后的首版条目结构：

```ts
interface VaultEntry {
  id: string;
  type: 'password' | 'apiKey';
  title: string;
  username?: string;
  secret: string;
  url?: string;
  tags: string[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}
```

加密流程：

1. 首次创建时生成随机数据加密密钥 DEK。
2. 使用 DEK 和 AES-256-GCM 加密整个 Vault 载荷。
3. 使用 Argon2id 从主密码派生密钥加密密钥 KEK。
4. 使用 KEK 包装 DEK，主密码只参与客户端密钥派生。
5. 服务端只保存盐、参数、IV、密文和版本。
6. 修改主密码时重新包装 DEK，不重新加密全部条目。
7. 每次加密使用新的随机 IV，同一密钥不得复用 IV。
8. 主密码不得发送服务端、写入日志或进入任何持久化状态。

首版使用一个整体加密载荷，保存时原子替换整个 Vault。这样实现简单，也不会向服务端泄露
条目名称、用户名、网站和标签等元数据。

## 7. 独立 Vault API

计划新增：

```text
GET    /api/vault
PUT    /api/vault
DELETE /api/vault
```

接口要求：

- GET 和 PUT 只传输密文封装。
- 所有响应使用 `Cache-Control: no-store`。
- PUT 使用 `revision` 防止并发覆盖。
- 限制请求体大小，并使用 Zod 验证密文封装结构。
- 每个 Route Handler 内直接验证访问会话，不能只依靠 Middleware。
- 修改请求验证 `Origin`，拒绝非预期跨站写入。
- 错误响应和日志不得输出密文、主密码或请求体。
- 删除 Vault 需要重新输入主密码并二次确认。

## 8. 访问保护与安全基线

Vault 启用前必须完成以下前置整改：

- 将当前 Next.js 14.2.0 升级到受支持且已修补的版本。
- 不再将入口密码的固定 SHA-256 值直接作为长期 Cookie。
- 使用随机、可过期和可撤销的服务端访问会话。
- 登录接口增加请求限流和失败退避。
- 会话 Cookie 使用 `HttpOnly`、`Secure` 和 `SameSite`。
- Vault API 在自身 Handler 内执行鉴权。
- Vault 主密码与 NaviDash 服务端入口密码保持分离。
- 增加 CSP、HSTS、`nosniff`、Referrer Policy 和点击劫持保护。

Vault 主密码只用于浏览器端解密；NaviDash 入口密码只负责阻止未授权用户访问页面和密文
API。客户端加密可以降低磁盘、数据库和备份泄露的影响，但不能防止页面解锁期间的 XSS、
恶意浏览器扩展、终端木马或被攻陷服务器下发的恶意 JavaScript。

## 9. 部署限制

增加显式功能开关：

```env
NAVIDASH_VAULT_ENABLED=false
```

部署要求：

- Vault 默认关闭，必须显式启用。
- 启用 Vault 前必须配置 NaviDash 访问保护，否则 Vault API 拒绝工作。
- 默认部署文档使用 `127.0.0.1`，优先仅本机访问。
- 跨设备访问推荐使用 Tailscale 或 WireGuard 等私有网络。
- 不支持直接路由器端口转发、UPnP 或公网 Tunnel。
- 非 HTTPS 的跨设备访问显示明显安全警告。
- 文档明确说明公网部署不在首版安全支持范围内。

## 10. 备份与恢复

普通 NaviDash 备份不得包含 Vault、主密码、解密状态或任何密钥。Vault 使用独立加密备份，
例如：

```text
navidash-vault-encrypted-2026-08-03.json
```

恢复规则：

- 导出的文件始终保持密文，可在其他实例使用原主密码解锁。
- 导入前检查 Schema 版本、文件大小和封装完整性。
- 先验证备份可以成功解密，再替换现有 Vault。
- 覆盖或删除前提示用户下载当前加密备份。
- 明确告知用户：忘记主密码后无法找回数据。

## 11. 测试范围

至少覆盖：

- `/` 命令解析、完整名称和简写别名。
- 空格、中文输入法和组合输入。
- 普通查询与 Vault 查询的状态和历史隔离。
- Vault 查询不进入外部搜索和启动器学习数据。
- 锁定状态不展示任何 Vault 条目元数据。
- 正确主密码解锁、错误主密码失败。
- 密文、IV 或认证标签被篡改后拒绝解密。
- 每次保存生成新的 IV。
- 次日零点、空闲超时、手动锁定和刷新后的行为。
- 普通 NaviDash 备份不包含 Vault。
- Vault API 未授权、跨站请求、请求体超限和 revision 冲突。
- 最终状态通过 `npm run lint`、`npm test` 和 `npm run build`。

## 12. 计划实施顺序

1. 更新 `SPEC.md`，定义 Vault 安全边界和 `/` 命令规则。
2. 新增架构决策文档，记录客户端加密、独立存储和部署范围。
3. 升级 Next.js，整改访问会话和安全响应头。
4. 将启动器改为真实输入框，支持空格和输入法。
5. 增加启动器模式和 `/` 命令解析。
6. 实现 `/v` 的锁定、解锁和结果界面。
7. 实现加密模块、Vault Schema 和独立密文存储。
8. 实现 Vault API、条目管理、复制和每日锁定。
9. 实现独立加密备份与恢复。
10. 补齐测试、部署文档和 `changelog.md`。

## 13. 待最终确认的默认选择

- 使用 `/v` 作为 Vault 命令，同时支持 `/vault`。
- 复用同一个启动器弹窗外壳，但隔离各模式的状态和数据来源。
- 当前页面会话内每日首次解锁，最长持续到次日零点。
- 空闲 30 分钟自动锁定，刷新或关闭页面后重新输入。
- 首版只支持本机和私有网络部署。
- 首版只保存密码和 API Key。
- `Enter` 默认复制秘密值。

本文件是讨论稿，不代表功能已经实现。确认方案后，应先更新 `SPEC.md` 与对应 Decision，
再开始修改产品行为、安全边界和持久化结构。
