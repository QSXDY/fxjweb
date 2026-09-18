/* 福鲜家 CMS · CSS 轻奢提夫尼蓝改造（一次性脚本，替换后写回 LF） */
'use strict';
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'css', 'style.css');

let c = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');

/* ---------- A. Hero 蒙版 → 大面积提夫尼蓝深调 ---------- */
const heroMaskOld = `.hero-mask {
  position: absolute; inset: 0;
  background:
    linear-gradient(90deg, rgba(22, 20, 14, 0.62) 0%, rgba(22, 20, 14, 0.32) 48%, rgba(22, 20, 14, 0.05) 100%),
    linear-gradient(0deg, rgba(22, 20, 14, 0.30) 0%, transparent 30%);
}`;
const heroMaskNew = `.hero-mask {
  position: absolute; inset: 0;
  background:
    linear-gradient(90deg, rgba(16, 74, 84, 0.74) 0%, rgba(22, 100, 110, 0.42) 50%, rgba(46, 142, 151, 0.08) 100%),
    linear-gradient(0deg, rgba(14, 66, 76, 0.46) 0%, transparent 35%);
}`;
c = c.replace(heroMaskOld, heroMaskNew);

/* ---------- B. plan-price → 专属方案引导条 ---------- */
const planPriceOld = `.plan-price {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 0; margin-bottom: 16px;
  border-top: 1px dashed var(--line-deep); border-bottom: 1px dashed var(--line-deep);
}
.plan-price strong {
  font-family: var(--font-serif); font-size: 34px; font-family: var(--font-serif); font-weight: 400;
  color: var(--gold-deep); line-height: 1;
}
.plan-price strong em { font-style: normal; font-size: 16px; margin-left: 2px; color: var(--ink-3); }
.plan-price span { font-size: 13px; color: var(--ink-3); line-height: 1.6; }
.plan-price span b { color: var(--tiffany-deep); font-family: var(--font-serif); font-weight: 400; }`;
const planPriceNew = `.plan-price {
  padding: 14px 16px; margin: 0 0 18px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--tiffany-soft) 0%, var(--tiffany-mist) 100%);
  border: 1px solid #CDE8EA;
  overflow: hidden;
}
.plan-price svg { float: left; width: 20px; height: 20px; color: var(--tiffany-deep); margin: 3px 10px 0 0; }
.plan-price .quote-main { display: block; font-family: var(--font-serif); font-size: 16px; color: var(--tiffany-deep); }
.plan-price .quote-sub { display: block; font-size: 12.5px; color: var(--ink-3); line-height: 1.55; margin-top: 3px; }`;
c = c.replace(planPriceOld, planPriceNew);

/* ---------- C. short-price → 体验方案引导条 ---------- */
const shortPriceOld = `.short-price {
  display: flex; align-items: baseline; gap: 10px;
  padding: 12px 0; margin-bottom: 14px;
  border-top: 1px dashed var(--line-deep); border-bottom: 1px dashed var(--line-deep);
}
.short-price strong { font-family: var(--font-serif); font-size: 32px; color: var(--gold-deep); line-height: 1; }
.short-price span { font-size: 13px; color: var(--ink-3); }`;
const shortPriceNew = `.short-price {
  padding: 12px 14px; margin-bottom: 14px;
  border-radius: 12px;
  background: var(--tiffany-soft);
  border: 1px solid #CDE8EA;
}
.short-price .quote-main { display: block; font-family: var(--font-serif); font-size: 15px; color: var(--tiffany-deep); }
.short-price .quote-sub { display: block; font-size: 12.5px; color: var(--ink-3); line-height: 1.55; margin-top: 3px; }`;
c = c.replace(shortPriceOld, shortPriceNew);

/* ---------- D. 删除短期价格小表样式 ---------- */
const shortTableBlock = `/* 短期价格小表 */
.short-price-box {
  margin-top: 40px; max-width: 720px; margin-left: auto; margin-right: auto;
}
.short-price-box h3 { font-family: var(--font-serif); font-size: 18px; font-family: var(--font-serif); font-weight: 400; text-align: center; margin-bottom: 14px; }
.short-price-box h3 span { font-family: var(--font-sans); font-size: 13px; font-weight: 400; color: var(--ink-3); }
.short-price-table-wrap { overflow-x: auto; background: var(--white); border: 1px solid var(--line); border-radius: 14px; }
.short-price-table { width: 100%; table-layout: fixed; border-collapse: collapse; }
.short-price-table th {
  font-family: var(--font-serif); font-family: var(--font-serif); font-weight: 400;
  background: var(--tiffany-soft); color: var(--tiffany-deep);
  padding: 12px 10px; text-align: center; border: 1px solid var(--line);
  font-size: 14.5px;
}
.short-price-table th:first-child { text-align: left; padding-left: 18px; }
.short-price-table td {
  padding: 12px 10px; text-align: center; border: 1px solid var(--line);
  font-family: var(--font-serif); font-family: var(--font-serif); font-weight: 400; color: var(--ink);
  font-size: 15px;
}
.short-price-table td:first-child { text-align: left; font-family: var(--font-sans); font-family: var(--font-medium); font-weight: 400; color: var(--ink-2); }
.short-price-note { text-align: center; font-size: 12.5px; color: var(--ink-3); margin-top: 12px; }

`;
c = c.replace(shortTableBlock, '');

/* ---------- E. 删除价格表 + 图表样式，替换为专属方案咨询区块 ---------- */
const pricingBlockStart = `/* ============================================================
   价格表
   ============================================================ */`;
const pricingBlockEnd = `/* ============================================================
   服务保障
   ============================================================ */`;
const si = c.indexOf(pricingBlockStart);
const ei = c.indexOf(pricingBlockEnd, si);
if (si >= 0 && ei >= 0) {
  const quoteStyles = `/* ============================================================
   专属方案咨询（原价格表，已去价格化）
   ============================================================ */
.quote-section {
  background: linear-gradient(135deg, #1F6E77 0%, var(--brand-primary-deep) 45%, var(--brand-primary) 75%, #8FD9DF 100%);
  position: relative;
}
.quote-section::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(640px 300px at 12% 0%, rgba(255,255,255,0.14), transparent 62%),
    radial-gradient(700px 320px at 88% 100%, rgba(255,255,255,0.12), transparent 62%);
}
.quote-inner { max-width: 840px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
.quote-inner .eyebrow-center { color: #EAF6F7; }
.quote-inner .eyebrow-center .line { background: rgba(255,255,255,0.7); }
.quote-inner h2 {
  font-family: var(--font-serif); font-weight: 400;
  font-size: clamp(1.7rem, 3vw, 2.3rem);
  color: #fff; margin: 18px 0 16px; letter-spacing: 0.02em; line-height: 1.4;
}
.quote-lead { font-size: 15px; line-height: 1.95; color: rgba(255,255,255,0.93); margin-bottom: 30px; }
.quote-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.btn-gold-lg {
  background: linear-gradient(135deg, #D8B47C, var(--brand-gold-dark));
  color: #fff; padding: 15px 34px; font-size: 16px;
  box-shadow: 0 12px 30px rgba(176, 141, 79, 0.35);
}
.btn-gold-lg:hover { transform: translateY(-2px); box-shadow: 0 16px 36px rgba(176,141,79,0.46); }
.btn-cream-lg {
  background: #FFFDF9; color: var(--tiffany-deep);
  padding: 15px 34px; font-size: 16px;
  box-shadow: 0 12px 30px rgba(14,66,76,0.2);
}
.btn-cream-lg:hover { transform: translateY(-2px); background: #FFFFFF; }
.quote-note { margin-top: 24px; font-size: 12.5px; color: rgba(255,255,255,0.8); }

`;
  c = c.slice(0, si) + quoteStyles + c.slice(ei);
} else {
  console.warn('[warn] 未定位到价格表样式块');
}

/* ---------- F. 硬编码色值 → 提夫尼蓝深调 ---------- */
c = c.replace(/\.btn-deep:hover \{ background: #347E88;/g, '.btn-deep:hover { background: #277A83;');
c = c.replace(/radial-gradient\(1000px 500px at 85% -10%, rgba\(112,200,208,0\.28\), transparent 60%\)/g,
  'radial-gradient(1000px 500px at 85% -10%, rgba(143,217,223,0.35), transparent 60%)');
c = c.replace(/linear-gradient\(135deg, #2B6A70 0%, var\(--brand-primary-deep\) 60%, var\(--brand-primary\) 100%\)/g,
  'linear-gradient(135deg, #1F6E77 0%, var(--brand-primary-deep) 55%, var(--brand-primary) 100%)');
c = c.replace(/linear-gradient\(135deg, #2B6A70, var\(--brand-primary-deep\)\)/g,
  'linear-gradient(135deg, #1F6E77, var(--brand-primary-deep))');
c = c.replace(/background: #F4EFE3;/g, 'background: var(--bg-beige);');
c = c.replace(/\.site-nav \{\n  position: fixed; inset: 0 0 auto 0; z-index: 100;\n  height: var\(--nav-h\);\n  background: rgba\(250, 246, 239, 0\.9\);/g,
  '.site-nav {\n  position: fixed; inset: 0 0 auto 0; z-index: 100;\n  height: var(--nav-h);\n  background: rgba(247, 243, 236, 0.92);');

/* ---------- G. 响应式中价格 tab 残留规则删除 ---------- */
c = c.replace(/  \.price-box \{ padding: 20px 14px 16px; \}\n  \.price-tabs \{ justify-content: center; \}\n  \.price-tab \{ padding: 8px 20px; \}\n/, '');
c = c.replace(/  \.price-tab \{ padding: 8px 14px; font-size: 13px; \}\n/, '');
c = c.replace(/  \.short-price \{ flex-direction: column; align-items: flex-start; gap: 2px; \}\n/, '');

/* ---------- H. 顶部 price-table 通用样式残留清理 ---------- */
c = c.replace(/\.price-table-wrap, \.short-price-table-wrap \{\n  overflow-x: auto; -webkit-overflow-scrolling: touch;\n  scrollbar-width: thin;\n\}\n\.price-table, \.short-price-table \{ min-width: 560px; \}\n@media \(max-width: 620px\) \{\n  \.price-table, \.short-price-table \{ min-width: 480px; \}\n\}\n/, '');

fs.writeFileSync(FILE, c, 'utf8');
console.log('[ok] style.css 改造完成, 长度=' + c.length);
