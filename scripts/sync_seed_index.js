/* 种子源 index.html 去价格 + 性能同步（幂等） */
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'index.html');

let h = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const before = h.length;

/* 1. 字体：精简为 Regular / Medium / Demibold 三个字重 */
for (const w of ['Thin', 'ExtraLight', 'Light', 'Normal', 'Semibold', 'Bold', 'Heavy']) {
  h = h.replace(new RegExp('<link rel="stylesheet" href="https://cdn\\.xrbk\\.cn/fonts/MiSans-' + w + '/result\\.css">\\s*', 'g'), '');
}

/* 2. 移除 ECharts CDN 引用（含周边注释） */
h = h.replace(/<!--[\s\S]*?本地化[^>]*?-->/, '');
h = h.replace(/\s*<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/echarts@[^"]+\/dist\/echarts\.min\.js" defer><\/script>/, '');
h = h.replace(/\n<!-- [\s\S]*?echarts[\s\S]*?-->\n?/i, '\n');

/* 3. plan-price 价格块 → 专属方案引导条 */
const planQuote = '<div class="plan-price plan-quote">\n            <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-phone" xlink:href="#ic-phone"/></svg>\n            <span class="quote-main">方案按体质专属定制</span>\n            <span class="quote-sub">获取专属服务方案 · 欢迎到店 / 来电了解</span>\n          </div>';
h = h.replace(/<div class="plan-price">\s*<strong>¥[\d.]+<em>起<\/em><\/strong>\s*<span>[\s\S]*?<\/span>\s*<\/div>/g, planQuote);

/* 4. short-price 价格块 → 体验方案引导条 */
const shortQuote = '<div class="short-price short-quote"><span class="quote-main">体验方案 · 按体质定制</span><span class="quote-sub">详询获取专属服务方案</span></div>';
h = h.replace(/<div class="short-price"><strong>¥[\d.]+<\/strong><span>[^<]*<\/span><\/div>/g, shortQuote);

fs.writeFileSync(FILE, h, 'utf8');
console.log('[ok] index.html 处理完成: ' + before + ' -> ' + h.length);
