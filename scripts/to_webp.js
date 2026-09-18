/* 全站图片统一 webp：存量 jpg/png/gif → webp（同目录同名 .webp），删除原格式；
 * 并同步更新 data/site.json、initial-site.json、index.html 中的 /uploads 引用为 .webp */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads');
const TARGETS = [
  path.join(ROOT, 'data', 'site.json'),
  path.join(ROOT, 'initial-site.json'),
  path.join(ROOT, 'index.html')
];

/** 遍历 uploads 收集待转换图片 */
function collect() {
  const out = [];
  (function walk(dir) {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const en of entries) {
      const full = path.join(dir, en.name);
      if (en.isDirectory()) walk(full);
      else if (/\.(jpe?g|png|gif)$/i.test(en.name)) out.push(full);
    }
  })(UPLOADS_DIR);
  return out;
}

async function main() {
  const imgs = collect();
  console.log('[to-webp] 待转换图片: ' + imgs.length);
  let ok = 0, fail = 0;
  for (const f of imgs) {
    const webp = f.replace(/\.(jpe?g|png|gif)$/i, '.webp');
    try {
      await sharp(f, { limitInputPixels: 60 * 1000 * 1000 })
        .rotate()
        .webp({ quality: 82 })
        .toFile(webp);
      const before = fs.statSync(f).size;
      const after = fs.statSync(webp).size;
      fs.unlinkSync(f);
      console.log('[ok] ' + path.relative(UPLOADS_DIR, f) + '  ' + before + ' -> ' + after + 'B');
      ok++;
    } catch (e) {
      console.warn('[fail] ' + f + ': ' + e.message);
      fail++;
    }
  }

  /* 更新引用：/uploads/xxx.<ext> -> .webp */
  let refCount = 0;
  for (const t of TARGETS) {
    if (!fs.existsSync(t)) { console.log('[skip] ' + t + ' 不存在'); continue; }
    let c = fs.readFileSync(t, 'utf8');
    const n = c.replace(/\/uploads\/[^"')\s>]+\.(jpe?g|png|gif)/gi, function (m) {
      return m.replace(/\.(jpe?g|png|gif)$/i, '.webp');
    });
    if (n !== c) {
      fs.writeFileSync(t, n, 'utf8');
      const hits = (c.match(/\/uploads\/[^"')\s>]+\.(jpe?g|png|gif)/gi) || []).length;
      refCount += hits;
      console.log('[ref] ' + path.relative(ROOT, t) + ' 更新 ' + hits + ' 处引用');
    }
  }

  /* 残留检查 */
  const remain = collect();
  console.log('--- 结果 ---');
  console.log('转换成功: ' + ok + '  失败: ' + fail + '  残留原格式: ' + remain.length);
  if (remain.length) remain.forEach((f) => console.log('  残留: ' + path.relative(UPLOADS_DIR, f)));
}

main().catch((e) => { console.error(e); process.exit(1); });
