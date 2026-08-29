# 局域网部署

NaviDash 适合运行在个人电脑、NAS 或小型服务器上，由同一局域网内的设备访问。推荐使用
Docker Compose，并把运行数据挂载到仓库之外。

## 部署前准备

- Docker Engine
- Docker Compose v2
- 一个长期存在且可写的宿主机数据目录

确认 Compose 可用：

```bash
docker compose version
```

NaviDash 的布局和配置保存在服务端文件中，因此无持久化文件系统的临时运行环境不适合作为
个人正式实例。

## 使用 Docker Compose 启动

```bash
git clone https://github.com/wtfllix/navidash.git
cd navidash
cp .env.example .env
sudo mkdir -p /opt/navidash-data
docker compose pull
docker compose up -d
```

检查容器状态：

```bash
docker compose ps
docker compose logs --tail=100 navidash
```

在部署主机上打开 `http://localhost:3000`。

## 下一步配置

个人局域网部署可以先保持可选项为空。常用配置如下：

| 变量                         | 用途                                 |
| -------------------------- | ---------------------------------- |
| `NAVIDASH_DATA_DIR`        | 自定义宿主机数据目录，默认 `/opt/navidash-data` |
| `NAVIDASH_ACCESS_PASSWORD` | 为私人实例增加单用户访问保护                     |
| `QWEATHER_API_KEY`         | Today 天气服务的 Key 或 JWT              |
| `QWEATHER_API_HOST`        | 可选的和风天气兼容 Host                     |
| `QWEATHER_AUTH_TYPE`       | `apikey` 或 `jwt`                   |
| `KOMARI_BASE_URL`          | 可选的 Komari 实例地址                    |
| `KOMARI_API_KEY`           | 可选的 Komari Bearer API Key          |

修改 `.env` 后重新创建容器：

```bash
docker compose up -d
```

天气密钥、访问密码和 Komari 凭据只在服务端环境变量中使用，不会写入 Widget 配置或备份。
逐项配置示例和验证步骤见[服务配置](./configuration)。

## 从其他设备访问

先在部署主机查询局域网 IP：

```bash
# Linux
hostname -I

# Windows PowerShell
ipconfig
```

找到部署主机的 IPv4 地址后，在同一局域网的手机或电脑上打开：

```text
http://192.168.x.x:3000
```

如果访问失败，请检查：

1. `docker compose ps` 是否显示 `0.0.0.0:3000->3000/tcp`。
2. 设备是否连接到同一个网络，且没有启用访客网络隔离。
3. 宿主机防火墙是否允许 TCP `3000`。
4. 路由器是否允许局域网设备互访。

建议为部署主机保留固定 DHCP 地址，避免 IP 变化导致访问书签失效。

## 远程访问

局域网内不需要域名或 HTTPS。如果需要从外网使用，优先通过可信 VPN 回到家庭网络；不要直接
把 `3000` 端口暴露到公网。确实需要域名访问时，再使用反向代理提供 HTTPS，并启用
`NAVIDASH_ACCESS_PASSWORD`。

更多环境变量、Docker Run、Node.js 和反向代理示例见[仓库内完整部署指南](https://github.com/wtfllix/navidash/blob/master/docs/DEPLOY.md)。
