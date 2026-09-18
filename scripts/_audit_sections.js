/* 审计：当前站点各 section 的元素密度（svg图标/img/标题/段落/列表），用于查缺补漏 */
'use strict';
const http = require('http');

function get(path) {
  return new Promise(function (resolve, reject) {
    http.get({ host: 'localhost', port: 3000, path: path }, function (res) {
      let s = '';
      res.setEncoding('utf8');
      res.on('data', function (c) { s += c; });
      res.on('end', function () { resolve(s); });
    }).on('error', reject);
  });
}

function count(html, re) {
  const m = html.match(re);
  return m ? m.length : 0;
}

(async function () {
  const pages = ['/', '/yuezi', '/beiyun', '/kongzhi', '/chanhou', '/shuhou'];
  for (const p of pages) {
    const html = await get(p);
    // 提取 main 内所有 section
    const main = html.match(/<main[\s\S]*?<\/main>/);
    const body = main ? main[0] : html;
    const secRe = /<section[^>]*class="([^"]*)"/g;
    let m;
    console.log('\n===== ' + p + ' =====');
    while ((m = secRe.exec(body)) !== null) {
      const cls = m[1];
      const start = m.index;
      // 找到该 section 结束（粗略：下一个 <section 或 </main>）
      const endMatch = body.slice(start + m[0].length).search(/<section[^>]|<\/main>/);
      const seg = endMatch === -1 ? body.slice(start) : body.slice(start, start + m[0].length + endMatch);
      const svgs = count(seg, /<svg/g);
      const imgs = count(seg, /<img/g);
      const h2 = count(seg, /<h2[ >]/g);
      const h3 = count(seg, /<h3[ >]/g);
      const p = count(seg, /<p[ >]/g);
      const ul = count(seg, /<ul[ >]/g);
      const li = count(seg, /<li[ >]/g);
      const a = count(seg, /<a[ >]/g);
      const btn = count(seg, /<button[ >]/g);
      const placeholder = seg.match(/占位|待定|敬请期待|即将上线/g);
      console.log(cls.slice(0, 34).padEnd(36)
        + ' svg:' + String(svgs).padStart(2)
        + ' img:' + String(imgs).padStart(2)
        + ' h2:' + String(h2).padStart(1)
        + ' h3:' + String(h3).padStart(2)
        + ' p:' + String(p).padStart(2)
        + ' li:' + String(li).padStart(2)
        + ' a:' + String(a).padStart(2)
        + ' btn:' + String(btn).padStart(2)
        + (placeholder ? ' [占位!' + placeholder.join(',') + ']' : ''));
    }
  }
})();
