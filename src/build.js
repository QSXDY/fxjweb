/* ============================================================
 * 福鲜家 CMS · dist 静态化生成器
 * 遍历所有已发布页面 -> dist/<slug>/index.html（首页 -> dist/index.html）
 * css/js 复制到 dist/css、dist/js（外部文件独立缓存，不内联进 HTML）
 * uploads 由 Web 服务器实时 serve（不复制图片副本，客户上传即时可见）
 * 调用时机：服务启动时 + 后台每次保存内容后
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const store = require('./store');
const render = require('./render');

const ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');

/** 递归复制目录 */
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  fs.readdirSync(src).forEach(function (f) {
    const s = path.join(src, f);
    const d = path.join(dst, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  });
}

/** 重新生成全部 dist 成品 */
function buildDist() {
  const d = store.load();
  fs.mkdirSync(DIST_DIR, { recursive: true });

  d.pages.forEach(function (page) {
    if (page.published === false) return;
    const html = render.renderPageCached(page);
    const outDir = page.slug ? path.join(DIST_DIR, page.slug) : DIST_DIR;
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
    console.log('[build] dist/' + (page.slug ? page.slug + '/index.html' : 'index.html'));
  });

  /* 404 页 */
  fs.writeFileSync(path.join(DIST_DIR, '404.html'), render.render404(), 'utf8');

  /* 静态资源副本：dist 自包含 css/js（EdgeOne 可直接加速，独立长缓存） */
  copyDir(path.join(ROOT, 'css'), path.join(DIST_DIR, 'css'));
  copyDir(path.join(ROOT, 'js'), path.join(DIST_DIR, 'js'));

  return true;
}

module.exports = { buildDist };

/* 直接执行：node src/build.js（Docker 镜像构建阶段调用） */
if (require.main === module) {
  buildDist();
  console.log('[build] dist 静态化完成 -> ' + DIST_DIR);
}
