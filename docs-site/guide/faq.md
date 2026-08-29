# 常见问题

## 手机无法打开页面

不要在手机上使用 `localhost`，它指向手机自己。请使用部署主机的局域网 IP，例如
`http://192.168.1.20:3000`，并确认：

- 手机和主机连接同一个网络。
- Compose 端口映射为 `0.0.0.0:3000->3000/tcp`。
- 主机防火墙允许 TCP `3000`。
- 路由器没有启用设备隔离。

## 刷新后修改消失

通常是 Demo 模式或持久化目录问题：

1. 确认 `.env` 中 `DEMO_MODE=false`，并重新创建容器。
2. 检查 `docker compose ps` 和 Compose 配置是否挂载了 `/app/data`。
3. 查看日志中是否存在权限或写入错误。

## 容器启动失败

```bash
docker compose ps
docker compose logs --tail=200 navidash
```

优先检查数据目录权限、端口 `3000` 是否被占用，以及 `.env` 的变量格式。宿主机数据目录必须
对容器运行用户可写。

## Today 没有天气

- 检查 `QWEATHER_API_KEY`、`QWEATHER_API_HOST` 和 `QWEATHER_AUTH_TYPE`。
- 修改环境变量后执行 `docker compose up -d`。
- 在设置中的天气服务区域测试连接。
- 确认部署主机可以访问天气服务地址。

## F1 积分没有更新

赛程使用应用内置数据；车手积分由服务端读取 Jolpica，并缓存 24 小时。请确认部署主机可以
访问 `https://api.jolpi.ca`。上游暂时失败时会继续使用最近一次成功缓存，首次请求没有缓存
时才会显示不可用状态。

## Komari 节点显示不可用

- 确认 `KOMARI_BASE_URL` 可从部署主机访问。
- 私有或隐藏节点需要填写 `KOMARI_API_KEY`。
- 修改环境变量后重新创建容器。
- 检查节点 UUID 是否仍存在，并查看容器日志中的超时提示。

## 端口 3000 已被占用

修改 `docker-compose.yml` 的宿主机端口：

```yaml
ports:
  - "8080:3000"
```

随后执行 `docker compose up -d`，并访问 `http://localhost:8080` 或对应的局域网地址。

## 如何彻底重置首页

优先在“设置 → 数据工具”使用恢复默认。需要清空全部运行数据时，先停止容器并备份数据目录，
再处理挂载目录中的文件，最后重新启动容器。
