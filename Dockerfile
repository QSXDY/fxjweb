# ============================================================
# 福鲜家 CMS · 多阶段构建
# 阶段1 build：pnpm 安装生产依赖 + 生成 dist 静态成品
# 阶段2 runtime：纯净 Alpine + 只拷 node 二进制（最终镜像约 297MB）
# ============================================================
FROM node:26.12.1-alpine AS build
WORKDIR /app

# Node 26 镜像不再自带 corepack，用 npm 只负责引导安装 pnpm 本身
RUN npm install -g pnpm@12.8.1 --no-fund --no-audit

# 先拷依赖清单，利用镜像层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

# 拷源码并生成 dist 静态成品（页面/404/css/js）
COPY . .
RUN node src/build.js

# ---------- 运行阶段 ----------
# 不带 npm/npx 与 Node 头文件，只拷官方镜像里的 node 二进制（省约 36MB）
FROM alpine:3.24.3
WORKDIR /app

# Node 运行所需的最小系统库；新增依赖时在本行补充
RUN apk add --no-cache libstdc++ libatomic ca-certificates

COPY --from=build /usr/local/bin/node /usr/local/bin/node

ENV NODE_ENV=production
ENV PORT=3004

# 代码与依赖
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server.js ./
COPY --from=build /app/src ./src
COPY --from=build /app/css ./css
COPY --from=build /app/js ./js
COPY --from=build /app/public/admin ./public/admin
COPY --from=build /app/public/img ./public/img
COPY --from=build /app/index.html ./index.html

# 首次启动模板：数据快照 / dist 成品 / 上传图片
# （挂载卷为空时由 server.js 拷贝到卷内，之后全部由卷持久化）
COPY --from=build /app/data/site.json ./initial-site.json
COPY --from=build /app/dist ./dist-template
COPY --from=build /app/public/uploads ./public/uploads-template

# 运行时数据目录（由 docker-compose 挂载卷覆盖）
RUN mkdir -p /app/data /app/public/uploads /app/dist

EXPOSE 3004
CMD ["node", "server.js"]
