/* ============================================================
 * 一次性迁移：assets/ 存量图片 -> uploads/<slug>/<YYYY-MM>/<时间戳-hex>.ext
 * 同步替换 index.html 与 data/site.json 中的引用（不重 seed，保护账号与已改内容）
 * 分类归属按图片所在页面区块：hero->top / tier->plans / qrcode->contact
 * kitchen、ai-system、app-trace 所在区块无对应导航栏目 -> general
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const UPLOADS = path.join(ROOT, 'public', 'uploads');
const INDEX = path.join(ROOT, 'index.html');
const SITE = path.join(ROOT, 'data', 'site.json');

const MAP = {
  'hero-1.jpg': 'top',
  'hero-2.jpg': 'top',
  'hero-3.jpg': 'top',
  'hero-4.jpg': 'top',
  'tier-standard.jpg': 'plans',
  'tier-custom.jpg': 'plans',
  'tier-premium.jpg': 'plans',
  'qrcode.png': 'contact',
  'kitchen.jpg': 'general',
  'ai-system.jpg': 'general',
  'app-trace.jpg': 'general'
};

if (!fs.existsSync(ASSETS)) {
  console.log('[migrate] assets 目录不存在，无需迁移');
  process.exit(0);
}

const files = fs.readdirSync(ASSETS).filter(function (f) {
  return /\.(jpe?g|png|webp|gif)$/i.test(f);
});
if (!files.length) {
  console.log('[migrate] assets 下没有图片，跳过');
  process.exit(0);
}

const renames = {};
files.forEach(function (f) {
  const src = path.join(ASSETS, f);
  const st = fs.statSync(src);
  const slug = MAP[f] || 'general';
  const ym = st.mtime.getFullYear() + '-' + String(st.mtime.getMonth() + 1).padStart(2, '0');
  const ts = Math.round(st.mtimeMs);
  const ext = path.extname(f).toLowerCase();
  const newName = ts + '-' + crypto.randomBytes(4).toString('hex') + ext;
  const dir = path.join(UPLOADS, slug, ym);
  fs.mkdirSync(dir, { recursive: true });
  fs.renameSync(src, path.join(dir, newName));
  renames[f] = '/uploads/' + slug + '/' + ym + '/' + newName;
  console.log('[migrate] ' + f + '  ->  ' + renames[f]);
});

function replaceIn(file) {
  if (!fs.existsSync(file)) return;
  let txt = fs.readFileSync(file, 'utf8');
  Object.keys(renames).forEach(function (old) {
    txt = txt.split('/assets/' + old).join(renames[old]);
    txt = txt.split('assets/' + old).join(renames[old]);
  });
  fs.writeFileSync(file, txt, 'utf8');
  console.log('[migrate] 引用已替换: ' + file);
}
replaceIn(INDEX);
replaceIn(SITE);

try {
  fs.rmdirSync(ASSETS);
  console.log('[migrate] assets 目录已移除');
} catch (e) {
  console.warn('[migrate] assets 目录未删除：' + e.message);
}
console.log('[migrate] 迁移完成');
