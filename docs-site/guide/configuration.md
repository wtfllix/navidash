# 服务配置

NaviDash 的运行配置位于仓库根目录的 `.env`。修改后需要重新创建容器：

```bash
docker compose up -d
```

所有可选配置都可以留空。先确认首页能够正常打开，再逐项启用需要的服务。

## 完整 `.env` 示例

下面是一份适合个人局域网部署的完整示例。复制后，只需要填写自己实际使用的可选服务：

```ini
# 基础设置
NEXT_PUBLIC_APP_NAME=NaviDash
NEXT_PUBLIC_DEFAULT_LOCALE=zh-CN
NEXT_PUBLIC_DEFAULT_BOOKMARKS=[]

# Docker Compose 在宿主机上的持久化目录
NAVIDASH_DATA_DIR=/opt/navidash-data

# 正式个人实例必须关闭 Demo 模式
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false

# 可选：单用户访问密码；留空表示关闭
NAVIDASH_ACCESS_PASSWORD=

# 可选：Today 天气
QWEATHER_API_KEY=
QWEATHER_API_HOST=
QWEATHER_AUTH_TYPE=apikey

# 可选：Komari 节点
KOMARI_BASE_URL=
KOMARI_API_KEY=
```

也可以直接从仓库生成配置：

```bash
cp .env.example .env
```

仓库中的最新版本见 [`.env.example`](https://github.com/wtfllix/navidash/blob/master/.env.example)。
不要把填写了真实密码或 API Key 的 `.env` 提交到 Git。

## 数据目录

默认宿主机目录为 `/opt/navidash-data`。需要改到 NAS 数据盘或其他位置时：

```ini
NAVIDASH_DATA_DIR=/your/data/path
```

目录必须长期存在且可写。Widget、布局和全局设置保存在这里，重建容器不会代替数据备份。

## 访问密码

局域网中有多台设备、又不希望所有设备都能直接打开首页时，可以启用单用户访问保护：

```ini
NAVIDASH_ACCESS_PASSWORD=replace-with-a-long-private-password
```

留空表示关闭。密码只存在于服务端环境变量中，不会写入 Widget、运行数据或导出备份。

::: warning
访问密码是私人实例的轻量保护。如果实例通过公网访问，还需要 HTTPS、访问限速或可信 VPN；
不要直接把应用端口暴露到公网。
:::

## Today 天气

Today 不配置天气时仍会显示时间和日期。天气信息由 NaviDash 服务端请求，浏览器不会直接持有密钥。

### API Key 模式

```ini
QWEATHER_API_KEY=your_qweather_key
QWEATHER_API_HOST=your-project-host.re.qweatherapi.com
QWEATHER_AUTH_TYPE=apikey
```

### JWT 模式

```ini
QWEATHER_API_KEY=your_qweather_jwt
QWEATHER_API_HOST=your-project-host.re.qweatherapi.com
QWEATHER_AUTH_TYPE=jwt
```

`QWEATHER_API_HOST` 可以包含或省略 `https://`。配置后按以下步骤验证：

1. 重新执行 `docker compose up -d`。
2. 打开 NaviDash 的“设置 → 天气服务”。
3. 刷新状态并执行连接测试。
4. 进入 Today Widget 设置，选择城市或匹配到的经纬度。

## Komari 节点

NaviDash 通过服务端读取一个固定 Komari 实例。公开节点可以不填写 API Key：

```ini
KOMARI_BASE_URL=https://komari.example.com
KOMARI_API_KEY=
```

私有或隐藏节点需要填写 Komari Bearer API Key：

```ini
KOMARI_BASE_URL=https://komari.example.com
KOMARI_API_KEY=your_komari_bearer_key
```

配置并重启后：

1. 从组件库添加 Komari。
2. 打开 Widget 设置并选择节点。
3. 选择是否显示实时网络速率。
4. 将刷新间隔设为 5、15 或 30 秒。

Komari 地址和 API Key 不会发送到浏览器，也不会写入 Widget 配置或备份。每张 Widget 绑定一台
节点，需要查看多台服务器时添加多张 Widget。

## F1 车手积分

F1 赛程来自应用内置数据，无需配置。切换到车手积分模式后，NaviDash 服务端会访问 Jolpica：

```text
https://api.jolpi.ca
```

该接口不需要 API Key。成功结果缓存 24 小时，因此不是比赛过程中的秒级实时积分。部署主机无法
访问 Jolpica 时，组件会优先使用最近一次成功缓存。

## Demo 模式

个人正式实例必须保持：

```ini
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
```

启用 Demo 模式后，页面仍可交互，但写入不会持久化，刷新时会恢复内置演示数据。

## 检查配置是否生效

```bash
docker compose up -d
docker compose ps
docker compose logs --tail=100 navidash
```

如果变量没有生效，确认修改的是当前 Compose 项目目录中的 `.env`，并检查变量两侧是否存在多余
引号或空格。更多排查方法见[常见问题](./faq)。
