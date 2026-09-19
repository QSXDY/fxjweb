# ============================================================
# 福鲜家 CMS · 多阶段构建
# 阶段1 build：安装生产依赖 + 生成 dist 静态成品
# 阶段2 runtime：只保留运行时文件（node:24-alpine，最终镜像约 100MB）
# ============================================================
FROM node:24-alpine AS build
WORKDIR /app

# 先拷依赖清单，利用镜像层缓存
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 拷源码并生成 dist 静态成品（页面/404/css/js）
COPY . .
RUN node src/build.js

# ---------- 运行阶段 ----------
FROM node:24-alpine
WORKDIR /app

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
