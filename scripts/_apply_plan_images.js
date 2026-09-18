/* 将 AI 配图 URL 写入 planLines.hero/card */
'use strict';
const fs = require('fs');

const DATA = 'E:/PC/网站/data/site.json';
const INIT = 'E:/PC/网站/initial-site.json';
const RESULT = 'E:/PC/网站/scripts/_plan_images_result.json';

const imgs = JSON.parse(fs.readFileSync(RESULT, 'utf8'));
const map = {};
imgs.forEach(function (i) { map[i.slug] = i.url; });

function patch(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const pl = d.settings.planLines || {};
  Object.keys(map).forEach(function (slug) {
    if (pl[slug]) {
      pl[slug].hero = map[slug];
      pl[slug].card = map[slug];
    }
  });
  fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
  return Object.keys(map).filter(function (s) { return pl[s] && pl[s].hero; }).length;
}

console.log('site.json 已更新: ' + patch(DATA) + ' 条餐线配图');
if (fs.existsSync(INIT)) console.log('initial-site.json 已更新: ' + patch(INIT) + ' 条餐线配图');
