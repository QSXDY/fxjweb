# 福鲜家营养餐 · 网站后台（CMS）使用与部署说明

本系统把原来的纯静态网站改造成了**带可视化编辑后台的内容管理系统**：

- 前台保持原有设计不变，网址、样式、文案原样保留；
- 后台地址 `http://服务器地址/admin`，登录后即可**可视化拖拽改页面、新建页面**；
- 「每日菜单」「客户评价」这类需要反复增删的栏目，在后台**条目管理**里维护，前台自动展示；
- 编辑器为 **GrapesJS v0.23.6**，内置**简体中文界面**；「代码」按钮可查看页面 HTML/CSS 源码；
- **静态化 + CDN 友好**：保存内容后自动生成 `dist/` 静态成品，CSS/JS 带版本号，接 EdgeOne 后改完立即生效、静态长缓存；
- **推荐 1Panel + Docker 部署**：只有一个应用容器，前台由 1Panel 自带 OpenResty 承担，资源最省。

---

## 一、本地运行（先在本机体验）

双击 **`启动.bat`**，或手动执行：

```bash
npm install --omit=dev   # 首次运行才需要
node server.js
```

启动成功后：

| 入口 | 地址 |
|---|---|
| 网站前台 | http://localhost:3000/ |
| 网站后台 | http://localhost:3000/admin |

> 端口默认 3000，如需更换：`set PORT=8080` 后再启动。

## 二、后台登录

1. 打开 `http://localhost:3000/admin`（服务器为 `https://你的域名/admin`）；
2. 账号：**ztfxj**；
3. 初始密码：**yfl2132995**（本地交付包内也有 `data/初始密码.txt` 备忘；**登录后请立即在「站点设置 → 修改密码」中改掉**）。

## 三、日常操作速查

### 改首页文字 / 图片 / 区块
- 「页面管理」→ 首页 → **编辑**，进入可视化编辑器：
  - 点击画布中的文字/图片直接修改；
  - 左侧「区块」面板可**拖拽**添加：标题、段落、图片、两栏、按钮、分隔线；
  - **「每日菜单列表」「客户评价列表」**两个数据组件拖到页面任何位置，对应条目自动展示；
  - 右上角「保存」或 `Ctrl+S`。**保存后前台与静态成品（dist）自动更新。**

### 新建页面（如“每日菜单”“关于我们”）
- 「页面管理」→「新建页面」→ 填标题和网址（小写字母/数字/短横线，如 `menu`）→ 保存后点「编辑」排版内容；
- 新页面访问地址：`http://服务器地址/menu`。

### 每日菜单 / 客户评价 增删改
- 「条目管理」→ 两个标签页分别维护：新增 / 上移下移排序 / 显示隐藏 / 编辑 / 删除，前台自动同步。

### 导航菜单（链接标识 = 锚点 = 图片分类文件夹）
- 「站点设置 → 导航菜单」：每项只需填**英文链接标识**（如 `team`），前台自动生成 `#team` 锚点；
- 标识同时用作**图片上传的分类文件夹**（`uploads/team/`）；修改标识后文件夹自动改名，已插入页面的图片不受影响；
- 「首页」为系统固定项（`top`），置顶不可删除；
- 标识规则：小写字母、数字、短横线（如 `team`、`menu-2026`），**不能有中文、空格、#**。

### 电话、微信、价格、导航
- 「站点设置」里可改：站点名称、电话（全站生效）、微信号、价格表（三档 × 三种周期）、套餐详情、导航菜单、修改密码。

---

## 四、部署到云服务器（推荐：1Panel + Docker，镜像已发布 DockerHub）

> **新流程**：代码在 GitHub（`QSXDY/fxjweb`），打标签自动构建并推送 DockerHub，
> 服务器只需 `docker compose pull && up`，**无需源码、无需本地构建**。

### 1. 服务器准备
- 安装 **1Panel**（面板自带 OpenResty、Docker、Compose）；
- 域名已解析到服务器（EdgeOne 接入见第七节）。

### 2. 上传编排文件
在服务器建目录 `/opt/fuxianjia/`，上传本项目根目录的 **`docker-compose.yml`** 即可：

```
/opt/fuxianjia/
├── docker-compose.yml      # 编排（容器 fxjweb，网络 1panel-network）
├── data/                   # 卷①：站点数据（首次自动从镜像模板初始化）
├── uploads/                # 卷②：上传图片（首次自动从镜像模板初始化）
└── dist/                   # 卷③：静态成品（首次自动从镜像模板初始化，保存后自动重建）
```

（`data/`、`uploads/`、`dist/` 三个目录可空着，容器首次启动会自动初始化。）

### 3. 拉取镜像并启动容器
1Panel → **容器 → 编排** → 新建编排 → 选择 `/opt/fuxianjia/docker-compose.yml` → 启动；
或命令行：
```bash
cd /opt/fuxianjia
docker compose pull      # 从 DockerHub 拉取 fxjweb 镜像
docker compose up -d
```
容器启动后：`fxjweb` 运行于 **1panel-network** 网络，端口 **3004**（**不映射公网**，仅内网可访问）。

> 换新版本：只需修改 `docker-compose.yml` 里的镜像 tag（如 `v1.1.0` → `v1.2.0`），再 `docker compose pull && docker compose up -d` 即可升级。

### 4. 在 1Panel 创建网站（OpenResty 承担前台）
1Panel → **网站 → 网站** → 创建网站 → 静态网站 → 填入域名；
- 网站目录填 **`/opt/fuxianjia/dist`**；
- 自动申请 SSL（面板一键）。

然后在网站的 **配置文件** 中追加以下 location（替换 `你的域名` 相关部分）：

```nginx
# 前台静态页面已由网站根目录提供（dist/）

# 上传图片：由宿主的 uploads 卷实时提供
location /uploads/ {
    alias /opt/fuxianjia/uploads/;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
}

# 后台：反代到容器（1panel-network 内网，用容器名）
location /admin {
    proxy_pass http://fxjweb:3004;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# 后台接口同样走反代
location /admin/api/ {
    proxy_pass http://fxjweb:3004;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

> 若面板反代里已支持「路径 → http://fxjweb:3004」的图形化规则，直接在面板添加即可，无需手写配置文件。

### 5. 验证
- 前台：`https://你的域名/` 正常；
- 后台：`https://你的域名/admin` 能登录；
- 图片：`https://你的域名/uploads/...` 能访问。

### 6. 日常维护
| 操作 | 命令 / 面板 |
|---|---|
| 查看容器状态/日志 | 1Panel 容器列表 → fxjweb（日志） |
| 更新到新版本 | GitHub 打新 tag → Actions 自动推镜像 → 服务器改 compose tag → `docker compose pull && docker compose up -d` |
| 重启容器 | 1Panel 容器 → 重启（或 `docker restart fxjweb`） |
| 备份 | 直接打包 `/opt/fuxianjia/`（重点是 data/、uploads/） |

---

## 四点五、发布新版本（GitHub Actions → DockerHub）

代码推送到 GitHub 后，**打标签即自动构建镜像**，服务器拉取即可升级：

```bash
git tag v1.1.0        # 按需递增版本号
git push origin v1.1.0
```

- 触发 `.github/workflows/docker-image.yml`，自动构建并推送：
  `<你的DockerHub用户名>/fxjweb:v1.1.0` 与 `...:latest`；
- **首次使用需在 GitHub 仓库配置两个 Secrets**（Settings → Secrets and variables → Actions）：
  - `DOCKERHUB_USERNAME`：DockerHub 用户名；
  - `DOCKERHUB_TOKEN`：DockerHub **Access Token**（账号设置 → Security → Access Tokens 创建，不是登录密码）；
- 镜像名默认 `QSXDY/fxjweb`（DockerHub 用户名 `QSXDY`），若不同，同步修改 `docker-compose.yml` 与 workflow 中的用户名；
- 构建平台默认 `linux/amd64`（常见云服务器）。

---

## 五、部署到云服务器（备选：PM2 直跑，不用 Docker）

### 1. 服务器准备
- 安装 Node.js 18+（推荐 20/22 LTS）与 PM2：`npm install -g pm2`。

### 2. 上传项目
上传到 `/opt/fuxianjia/`（除 `node_modules`、`data/site.json` 外的全部文件）。

### 3. 安装依赖并启动
```bash
cd /opt/fuxianjia
npm install --omit=dev
PORT=3004 pm2 start server.js --name fuxianjia
pm2 save && pm2 startup   # 开机自启（按提示执行，重启服务器后自动拉起，无需手动）
```

### 4. Nginx 反代 + 域名
`/etc/nginx/conf.d/fuxianjia.conf`（或 1Panel 网站反向代理）：

```nginx
server {
    listen 80;
    server_name 你的域名;
    client_max_body_size 20m;
    location / { proxy_pass http://127.0.0.1:3004; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; }
}
```

---

## 六、备份与恢复（重要）

整站数据都在**目录卷**里，备份=打包：

```bash
# 备份整个部署目录（data 站点数据 + uploads 图片 + dist 静态成品）
tar -czf /备份目录/fuxianjia-$(date +%F).tar.gz -C /opt fuxianjia
```

恢复：解包回 `/opt/` 后 `docker compose up -d`（PM2 则 `pm2 restart fuxianjia`）。

**建议每天自动备份**（crontab）：
```bash
0 3 * * * tar -czf /备份目录/fuxianjia-$(date +\%F).tar.gz -C /opt fuxianjia
```

---

## 七、接入 EdgeOne 加速

### 1. 域名接入
- 在 EdgeOne 控制台添加站点 → 域名 CNAME 指向 EdgeOne 分配的地址 → 回源填**服务器 IP**（80/443）。

### 2. 缓存规则（重要）
| 对象 | 规则 |
|---|---|
| `/css/*` `/js/*` `/uploads/*` | **长缓存**（30 天），静态资源 URL 带版本号（如 `style.css?v=xxx`），版本号变化即视为新资源立即回源，**改完内容前台秒级生效** |
| `/` 与 `/menu` 等页面 HTML | 短缓存（60~300 秒），或使用 EdgeOne「刷新缓存」立即生效 |
| `/admin` 与 `/admin/*` | **不缓存**（动态后台，始终回源） |

### 3. 更新缓存机制说明
- 后台每次保存内容 → 自动重新生成 `dist/` + CSS/JS 版本号 +1；
- EdgeOne 看到**新 URL**（版本号变化）立即回源取新文件，客户刷新即见，**不需要等 TTL，也不需要手动刷新**；
- 页面 HTML 建议短 TTL（60 秒），保证改完最迟 1 分钟全网生效。

---

## 八、技术要点（给维护同学）

- **存储**：单文件 JSON（`data/site.json`），原子写入；首次启动若数据缺失，自动从 `initial-site.json` 初始化（保留正式账号与内容），不会重置；
- **上传目录**：`uploads/<导航slug>/<YYYY-MM>/<时间戳-随机hex>.扩展名`，按导航分类 × 月份分层，素材库按分类分组、组内时间倒序；
- **静态化**：保存内容自动生成 `dist/<slug>/index.html`（首页 `dist/index.html`），css/js 复制到 `dist/css`、`dist/js`；上传图片由 Web 服务器实时提供，不复制副本；
- **导航**：存英文 slug（`team`），前台自动拼 `#team`；slug 变更自动重命名 `uploads/<旧slug>/` 并全局替换页面引用；
- **安全**：后台登录密码错误锁定（5 次锁 10 分钟）、写操作 CSRF 校验、上传仅图片且限 10MB、后台 HTML 只能登录后访问、`/admin` 响应 no-store；
- **缓存**：前台 css/js/图片长缓存（本地模式 24h），后台界面 no-cache；页面渲染有内存缓存，保存时自动失效。

---

## 九、常见问题

- **忘记后台密码**：停止容器 → 从备份恢复 `data/site.json` → 启动；无备份时删除 `data/site.json` 重启会从 `initial-site.json` 恢复初始数据（密码同初始），**但仍请先备份**。
- **想彻底重置站点**：备份后删除 `data/site.json` 与 `uploads/` 重启，系统会从镜像初始模板重建。
- **上传图片失败**：检查 OpenResty/Nginx 的 `client_max_body_size`（默认 1M 太小，建议 20m）与安全组端口。
- **前台更新慢**：EdgeOne 页面 HTML 缓存 TTL 过大，调到 60 秒或保存后手动刷新缓存。
