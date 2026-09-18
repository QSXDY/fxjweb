/* 将三档图 URL 写入 planLines.tiers[].img（替换占位 hero） */
'use strict';
const fs = require('fs');
const DATA = 'E:/PC/网站/data/site.json';
const INIT = 'E:/PC/网站/initial-site.json';
const RESULT = 'E:/PC/网站/scripts/_tier_images_result.json';

const imgs = JSON.parse(fs.readFileSync(RESULT, 'utf8'));
const map = {};
imgs.forEach(function (i) { map[i.slug + ':' + i.tier] = i.url; });

function patch(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const pl = d.settings.planLines;
  let n = 0;
  Object.keys(pl).forEach(function (slug) {
    (pl[slug].tiers || []).forEach(function (t) {
      const u = map[slug + ':' + t.key];
      if (u) { t.img = u; n++; }
    });
  });
  fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
  return n;
}
console.log('site.json tiers 图:', patch(DATA));
console.log('initial-site.json tiers 图:', patch(INIT));
