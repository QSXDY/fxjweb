/* 给 planLines 各线加 enabled: true，供后台「页面管理」开关控制 */
'use strict';
const fs = require('fs');
['E:/PC/网站/data/site.json', 'E:/PC/网站/initial-site.json'].forEach(function (file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const pl = d.settings.planLines || {};
  let n = 0;
  Object.keys(pl).forEach(function (k) {
    if (typeof pl[k].enabled === 'undefined') { pl[k].enabled = true; n++; }
  });
  fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
  console.log(file.split('/').pop() + ': 补充 enabled ' + n + ' 条');
});
