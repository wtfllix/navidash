# NaviDash 部署指南

本文档面向长期自托管使用。推荐方案是 Docker Compose，并将运行数据挂载到仓库之外。

## 部署前准备

你需要：

- Docker Engine
- Docker Compose v2
- 一个可写的宿主机数据目录

确认 Compose 可用：

```bash
docker compose version
```

如果系统只提供旧版 `docker-compose`，可以在下文命令中使用它替代 `docker compose`。

## 推荐：Docker Compose

### 1. 获取项目

```bash
git clone https://github.com/wtfllix/navidash.git
cd navidash
```

### 2. 准备持久化目录

默认使用 `/opt/navidash-data`：

```bash
sudo mkdir -p /opt/navidash-data
```

容器启动时会修正挂载目录权限。不要把重要运行数据只保存在容器内部。

如果需要其他位置，在 `.env` 中设置：

```env
NAVIDASH_DATA_DIR=/your/data/path
```

### 3. 创建环境配置

```bash
cp .env.example .env
```

个人部署可以保持所有可选项为空。常用变量如下：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NAVIDASH_DATA_DIR` | `/opt/navidash-data` | 宿主机数据目录 |
| `NAVIDASH_ACCESS_PASSWORD` | 空 | 启用单用户访问保护 |
| `QWEATHER_API_KEY` | 空 | 和风天气 API Key 或 JWT |
| `QWEATHER_API_HOST` | 空 | 自定义和风天气兼容 Host |
| `QWEATHER_AUTH_TYPE` | `apikey` | `apikey` 或 `jwt` |

#### 可选：单用户访问保护

```env
NAVIDASH_ACCESS_PASSWORD=replace-with-a-long-private-password
```

留空表示关闭。密码只存在于服务端环境变量中，不会写入 Widget、运行数据或导出备份。

这是一层轻量的私人实例保护，不替代公网环境中的 HTTPS、访问限速或完整身份系统。

#### 可选：Today 天气

API Key 模式：

```env
QWEATHER_API_KEY=your_qweather_key
QWEATHER_API_HOST=your-project-host.re.qweatherapi.com
QWEATHER_AUTH_TYPE=apikey
```

JWT 模式：

```env
QWEATHER_API_KEY=your_qweather_jwt
QWEATHER_API_HOST=your-project-host.re.qweatherapi.com
QWEATHER_AUTH_TYPE=jwt
```

`QWEATHER_API_HOST` 可以包含或省略 `https://`。修改天气配置后需要重启容器。

### 4. 启动

```bash
docker compose pull
docker compose up -d
```

检查状态和日志：

```bash
docker compose ps
docker compose logs --tail=100 navidash
```

浏览器打开：

```text
http://localhost:3000
```

### 5. 局域网访问

同一局域网中的设备使用宿主机 IP：

```text
http://192.168.x.x:3000
```

如果无法访问，依次检查：

1. `docker compose ps` 中是否显示 `0.0.0.0:3000->3000/tcp`。
2. 手机与服务器是否连接同一局域网，且没有启用访客网络隔离。
3. 宿主机防火墙是否允许 TCP `3000`。
4. 路由器或系统防火墙是否阻止设备之间互访。

## HTTPS 与反向代理

如果实例通过公网或域名访问，建议使用 Caddy、Nginx、Traefik 等反向代理提供 HTTPS。

Nginx 最小示例：

```nginx
server {
    listen 443 ssl http2;
    server_name start.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

当反向代理与 NaviDash 位于同一台机器时，可以把 Compose 端口映射收紧为：

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

修改后运行 `docker compose up -d` 使配置生效。

## 升级

升级前建议先备份数据：

```bash
git pull --ff-only
docker compose pull
docker compose up -d --remove-orphans
docker compose ps
```

升级不会主动清空挂载目录。旧版 `widgets.json`、`widget-layouts.json` 和
`widget-configs.json` 仍可作为迁移来源读取；新数据写入 `widget-snapshot.json`。

`0.7.3` 是 NaviDash 正式承诺持久化数据向前兼容的起点。后续版本会通过固定测试夹具验证
Snapshot、Settings 和应用内备份的迁移。更早版本仍会尽力读取可识别数据，但旧组件与旧
画布不保证完整保留；从 `0.6.x` 或更早版本升级时，请先备份整个数据目录，并预期重新配置
首页布局。

## 备份与恢复

### 应用内备份

在“设置 → 数据工具”中导出 JSON，适合迁移首页布局、配置、书签和设置。

### 数据目录备份

为保证文件状态一致，先暂停容器：

```bash
docker compose stop navidash
sudo tar -C /opt -czf "navidash-data-$(date +%F).tar.gz" navidash-data
docker compose start navidash
```

如果使用了自定义 `NAVIDASH_DATA_DIR`，请相应替换路径。

恢复时建议先保留当前目录，再把备份解压到新的空目录中：

```bash
docker compose down
sudo mv /opt/navidash-data /opt/navidash-data.before-restore
sudo tar -C /opt -xzf navidash-data-YYYY-MM-DD.tar.gz
docker compose up -d
```

确认恢复成功后，再自行处理 `.before-restore` 目录。

## 运行数据

容器内数据目录为 `/app/data`，主要文件包括：

- `settings.json`
- `widget-snapshot.json`

Widget 布局、配置和书签通过带 revision 的原子快照一起保存。天气密钥、访问密码和启动器
本地学习记录不在该快照中：

- 天气密钥与访问密码来自服务端环境变量。
- 启动器学习记录默认保存在使用它的浏览器中。

## 其他运行方式

### Docker Run

```bash
docker run -d \
  --name navidash \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/navidash-data:/app/data \
  -e DATA_DIR=/app/data \
  -e NAVIDASH_ACCESS_PASSWORD= \
  -e QWEATHER_API_KEY= \
  -e QWEATHER_API_HOST= \
  -e QWEATHER_AUTH_TYPE=apikey \
  ghcr.io/wtfllix/navidash:latest
```

### 本地构建镜像

```bash
docker build -t navidash:local .
docker run -d \
  --name navidash \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/navidash-data:/app/data \
  -e DATA_DIR=/app/data \
  navidash:local
```

### 直接运行 Node.js

需要 Node.js 18+，推荐 Node.js 20：

```bash
npm ci
cp .env.example .env.local
npm run build
DATA_DIR=/absolute/path/to/navidash-data npm start
```

确保运行用户对 `DATA_DIR` 有读写权限。生产环境建议使用 systemd、PM2 或其他进程管理器。

## 常见问题

### 页面可以打开，但刷新后修改消失

- 确认没有启用 `DEMO_MODE`。
- 检查 Compose 是否实际挂载了 `/app/data`。
- 查看 `docker compose logs navidash` 中是否有权限或写入错误。

### Today 没有天气

- 检查 `.env` 中的 Key、Host 和认证方式。
- 执行 `docker compose up -d` 重新创建容器。
- 在设置页的“天气服务”中刷新状态并测试连接。
- 确认宿主机可以访问天气服务地址。

### 手机无法通过局域网打开

- 不要使用手机上的 `localhost`，应使用运行 NaviDash 的电脑或服务器 IP。
- 确认端口映射为 `0.0.0.0:3000`，而不是仅绑定 `127.0.0.1`。
- 检查防火墙和 Wi-Fi 客户端隔离。

### 容器启动失败

```bash
docker compose ps
docker compose logs --tail=200 navidash
```

重点检查数据目录权限、端口 `3000` 是否被占用，以及环境变量格式是否正确。

### 端口 3000 已被占用

修改 `docker-compose.yml` 的宿主机端口：

```yaml
ports:
  - "8080:3000"
```

随后访问 `http://localhost:8080`。

## 镜像发布

仓库中的 [Docker 发布工作流](../.github/workflows/docker-publish.yml)会在 `master`、`main`
和版本标签更新时构建 GHCR 镜像。Compose 默认使用：

```text
ghcr.io/wtfllix/navidash:latest
```
