/* ============================================================
 * 下载 5 条产品线 AI 配图 → 转 webp → uploads/plans/2026-09/
 * 运行：node scripts/save_plan_images.js
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'uploads', 'plans', '2026-09');

const IMAGES = [
  { slug: 'yuezi', url: 'https://aka.doubaocdn.com/s/XGwUIZ7bO1' },
  { slug: 'beiyun', url: 'https://aka.doubaocdn.com/s/Y1xiwKqXqc' },
  { slug: 'kongzhi', url: 'https://aka.doubaocdn.com/s/QxLXlHfALC' },
  { slug: 'chanhou', url: 'https://aka.doubaocdn.com/s/9VlIMOpXOO' },
  { slug: 'shuhou', url: 'https://aka.doubaocdn.com/s/n2gq9uInjp' }
];

function download(url) {
  return new Promise(function (resolve, reject) {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () { resolve(Buffer.concat(chunks)); });
    }).on('error', reject);
  });
}

(async function () {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  for (const img of IMAGES) {
    try {
      const buf = await download(img.url);
      const name = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + '.webp';
      const webp = await sharp(buf, { limitInputPixels: 100 * 1000 * 1000 })
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      fs.writeFileSync(path.join(OUT_DIR, name), webp);
      const url = '/uploads/plans/2026-09/' + name;
      results.push({ slug: img.slug, url: url, bytes: webp.length });
      console.log('[img] ' + img.slug + ' -> ' + url + ' (' + webp.length + 'B)');
    } catch (e) {
      console.log('[img] ' + img.slug + ' FAILED: ' + e.message);
    }
  }
  fs.writeFileSync(path.join(ROOT, 'scripts', '_plan_images_result.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log('[img] done');
})();
