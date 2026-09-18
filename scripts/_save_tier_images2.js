/* 下载 15 张三档套餐图（curl.exe）→ 转 webp → 更新 planLines tiers.img */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const sharp = require('sharp');
const crypto = require('crypto');

const ROOT = 'E:/PC/网站';
const OUT_DIR = path.join(ROOT, 'public', 'uploads', 'plans', '2026-09');
const TMP = path.join(ROOT, 'scripts', '_tmp_dl');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const IMAGES = [
  { slug: 'yuezi', tier: 'standard', url: 'https://aka.doubaocdn.com/s/nw76mRwWCS' },
  { slug: 'yuezi', tier: 'custom', url: 'https://aka.doubaocdn.com/s/0FPx8xpvlN' },
  { slug: 'yuezi', tier: 'premium', url: 'https://aka.doubaocdn.com/s/v1YRbccdZX' },
  { slug: 'beiyun', tier: 'standard', url: 'https://aka.doubaocdn.com/s/frAYO5rkGi' },
  { slug: 'beiyun', tier: 'custom', url: 'https://aka.doubaocdn.com/s/YrF3MIJBUT' },
  { slug: 'beiyun', tier: 'premium', url: 'https://aka.doubaocdn.com/s/vevguv2QvQ' },
  { slug: 'kongzhi', tier: 'standard', url: 'https://aka.doubaocdn.com/s/ScaNVYpG09' },
  { slug: 'kongzhi', tier: 'custom', url: 'https://aka.doubaocdn.com/s/2MAxd43dmP' },
  { slug: 'kongzhi', tier: 'premium', url: 'https://aka.doubaocdn.com/s/mPBB5m8tnY' },
  { slug: 'chanhou', tier: 'standard', url: 'https://aka.doubaocdn.com/s/dVETu0ekZU' },
  { slug: 'chanhou', tier: 'custom', url: 'https://aka.doubaocdn.com/s/oDSCftD2iW' },
  { slug: 'chanhou', tier: 'premium', url: 'https://aka.doubaocdn.com/s/whVKFBdAXm' },
  { slug: 'shuhou', tier: 'standard', url: 'https://aka.doubaocdn.com/s/KLx05fci6h' },
  { slug: 'shuhou', tier: 'custom', url: 'https://aka.doubaocdn.com/s/BOj2vR3uH6' },
  { slug: 'shuhou', tier: 'premium', url: 'https://aka.doubaocdn.com/s/FmZ3qLRJkS' }
];

(async function () {
  const results = [];
  for (const img of IMAGES) {
    const tmpFile = path.join(TMP, img.slug + '_' + img.tier + '.jpg');
    try {
      execFileSync('curl.exe', ['-L', '-s', '-o', tmpFile, img.url, '--max-time', '60'], { stdio: 'ignore' });
      const buf = fs.readFileSync(tmpFile);
      const name = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + '.webp';
      const webp = await sharp(buf, { limitInputPixels: 100 * 1000 * 1000 })
        .rotate().resize({ width: 1280, withoutEnlargement: true })
        .webp({ quality: 82 }).toBuffer();
      fs.writeFileSync(path.join(OUT_DIR, name), webp);
      results.push({ slug: img.slug, tier: img.tier, url: '/uploads/plans/2026-09/' + name });
      console.log('[img] ' + img.slug + '/' + img.tier + ' -> ' + name + ' (' + webp.length + 'B)');
    } catch (e) {
      console.log('[img] ' + img.slug + '/' + img.tier + ' FAILED: ' + e.message);
    } finally {
      try { fs.unlinkSync(tmpFile); } catch (e) {}
    }
  }
  fs.writeFileSync(path.join(ROOT, 'scripts', '_tier_images_result.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log('[img] done ' + results.length + '/' + IMAGES.length);
})();
