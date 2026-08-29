# 升级与备份

升级前先备份，尤其是在跨版本升级或更换部署主机时。NaviDash 的运行数据位于宿主机挂载目录，
不要只依赖容器内部文件。

## 应用内 JSON 备份

打开“设置 → 数据工具”，导出 JSON。应用内备份适合迁移：

- Widget 配置
- 桌面与手机布局
- 书签库
- 全局设置

导入备份或应用模板会覆盖当前组件与布局，操作前请先导出当前版本。

## 备份数据目录

Docker Compose 默认目录为 `/opt/navidash-data`。为保证文件状态一致，先暂停容器：

```bash
docker compose stop navidash
sudo tar -C /opt -czf "navidash-data-$(date +%F).tar.gz" navidash-data
docker compose start navidash
```

如果设置了 `NAVIDASH_DATA_DIR`，请替换为实际目录。建议定期把压缩包复制到另一块磁盘或家庭
备份设备。

## 升级容器

```bash
git pull --ff-only
docker compose pull
docker compose up -d --remove-orphans
docker compose ps
```

升级不会主动清空挂载目录。出现问题时先查看：

```bash
docker compose logs --tail=200 navidash
```

如果需要回退镜像，先停止当前容器并保留现有数据目录，再恢复到旧版本可读取的备份。

## 恢复数据

恢复前保留当前目录，避免误操作后无法返回：

```bash
docker compose down
sudo mv /opt/navidash-data /opt/navidash-data.before-restore
sudo tar -C /opt -xzf navidash-data-YYYY-MM-DD.tar.gz
docker compose up -d
```

确认首页和设置恢复正确后，再自行处理 `.before-restore` 目录。

## 迁移到另一台主机

1. 在旧主机导出 JSON，并暂停容器备份完整数据目录。
2. 在新主机拉取同一版本代码，创建相同的 `.env` 配置和数据目录。
3. 恢复数据目录后启动容器。
4. 从新主机的局域网 IP 验证首页、设置和外部服务状态。

访问密码、天气密钥和 Komari 凭据来自 `.env`，不在 JSON 或 Snapshot 中；迁移时需要单独复制
并妥善保护这些环境变量。
