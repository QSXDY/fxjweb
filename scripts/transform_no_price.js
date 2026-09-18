/* ============================================================
 * 福鲜家 CMS · 去价格化 + 营销化改造（一次性转换脚本）
 * 1) 物理删除 settings.prices / pricesMeta，清理价格文案
 * 2) 删除页面价格表 / 均价图 / 价格行，替换为「咨询获取专属方案」引导
 * 3) 清理套餐详情中的价格暗示文案
 * 4) 删除导航「价格」项
 * 作用于：data/site.json、initial-site.json、index.html（种子源）
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'site.json');
const INITIAL_FILE = path.join(ROOT, 'initial-site.json');
const INDEX_FILE = path.join(ROOT, 'index.html');

/* ---------- 通用 HTML 价格区块清理 ---------- */

/** 替换三档套餐卡中的 plan-price 价格行为咨询引导（3 处） */
function cleanPlanPrices(html) {
  const re = /<div class="plan-price">[\s\S]*?<\/div><ul class="plan-features">/g;
  return html.replace(re, function () {
    return (
      '<div class="plan-price plan-quote"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-phone" xlink:href="#ic-phone"/></svg>' +
      '<span class="quote-main">方案按体质专属定制</span>' +
      '<span class="quote-sub">获取专属服务方案 · 欢迎到店 / 来电了解</span></div><ul class="plan-features">'
    );
  });
}

/** 替换短期体验卡中的 short-price 价格行为咨询引导（3 处） */
function cleanShortPrices(html) {
  const re = /<div class="short-price">[\s\S]*?<\/div><ul class="short-features">/g;
  return html.replace(re, function () {
    return (
      '<div class="short-price short-quote"><span class="quote-main">体验方案 · 按体质定制</span>' +
      '<span class="quote-sub">详询获取专属服务方案</span></div><ul class="short-features">'
    );
  });
}

/** 删除短期价格小表整块（保留外层 section 结束标签） */
function removeShortPriceBox(html) {
  const start = html.indexOf('<!-- 短期价格小表 -->');
  if (start < 0) return html;
  const endMark = '价格以门店 / 电话咨询为准。</p>';
  const end = html.indexOf(endMark, start);
  if (end < 0) return html;
  return html.slice(0, start) + html.slice(end + endMark.length);
}

/** 替换价格明细 section（价格表 + 均价图）为「专属方案咨询」引导区块 */
function replacePricingSection(html) {
  const startMark = '<!-- ========== 价格表 ========== -->';
  const start = html.indexOf(startMark);
  if (start < 0) return html;
  const endMark = '<!-- ========== 服务';
  const end = html.indexOf(endMark, start);
  if (end < 0) return html;
  const quoteSection =
    '<!-- ========== 专属方案咨询（原价格明细，去价格化） ========== -->' +
    '<section id="quote" class="section quote-section">' +
    '<div class="container">' +
    '<div class="quote-inner reveal">' +
    '<p class="eyebrow-center"><span class="line"></span>专属方案<span class="line"></span></p>' +
    '<h2>每一份月子餐，都为你专属定制</h2>' +
    '<p class="quote-lead">我们的营养师与中医顾问会根据你的体质、恢复阶段与口味偏好，一对一制定专属调理方案。<br/>服务内容与周期均可按需组合，欢迎来电或添加微信了解详情。</p>' +
    '<div class="quote-actions">' +
    '<a class="btn btn-gold-lg" data-action="consult" href="/tel:19989901658"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"/></svg>电话咨询专属方案</a>' +
    '<button class="btn btn-cream-lg" id="quoteCopyWx"><svg viewBox="0 0 24 24"><use href="#ic-wechat" xlink:href="#ic-wechat"/></svg>添加微信了解详情</button>' +
    '</div>' +
    '<p class="quote-note">到店可免费试吃 · 参观全开放厨房；所有方案均以门店沟通为准。</p>' +
    '</div>' +
    '</div>' +
    '</section>';
  return html.slice(0, start) + quoteSection + html.slice(end);
}

/** 清理正文中的价格暗示文案 */
function cleanCopy(html) {
  return html
    .replace('服务更全 · 价格透明', '服务更全 · 体质专配')
    .replace('3 天可抵扣升级', '可升级长周期套餐')
    .replace('从高性价比到尊享私配，服务深度逐级升级，价格公开透明', '从安心调养到尊享私配，服务深度逐级升级，方案按体质专属定制')
    .replace('解答套餐内容、价格与配送细节', '解答套餐内容、服务细节与专属调理方案');
}

function cleanBody(html) {
  let h = html;
  h = cleanPlanPrices(h);
  h = cleanShortPrices(h);
  h = removeShortPriceBox(h);
  h = replacePricingSection(h);
  h = cleanCopy(h);
  return h;
}

/** 清理 settings：删除价格数据、改写价格文案 */
function cleanSettings(s) {
  delete s.prices;
  delete s.pricesMeta;
  if (typeof s.footerNote === 'string') {
    s.footerNote = s.footerNote
      .replace('页面图片为示意，餐品与价格以门店当日实际为准', '页面图片为示意，服务内容以门店当日实际为准')
      .replace('餐品与价格以门店当日实际为准', '服务内容以门店当日实际为准');
  }
  return s;
}

/** 清理套餐详情中的价格暗示文案 */
function cleanDetails(d) {
  if (!d || typeof d !== 'object') return d;
  Object.keys(d).forEach(function (k) {
    const item = d[k];
    if (!item || !Array.isArray(item.groups)) return;
    item.groups.forEach(function (g) {
      if (!Array.isArray(g.items)) return;
      g.items = g.items.map(function (s) {
        return String(s)
          .replace('同价位中服务内容更完整', '服务内容完整、流程省心')
          .replace('体验满意后升级 14 / 28 / 42 天套餐，1 天费用全额抵扣，只需补差价', '体验满意可升级 14 / 28 / 42 天套餐，体验费用可抵扣升级')
          .replace('升级 14 / 28 / 42 天套餐，3 天费用全额抵扣，只需补差价', '升级 14 / 28 / 42 天套餐，体验费用可抵扣升级')
          .replace('升级 28 / 42 天套餐，7 天费用全额抵扣，只需补差价', '升级 28 / 42 天套餐，体验费用可抵扣升级')
          .replace('升级 14 / 28 / 42 天套餐，已付费用全额抵扣、只需补差价', '升级 14 / 28 / 42 天套餐，体验费用可抵扣升级');
      });
    });
  });
  return d;
}

/** 清理导航：删除「价格」项 */
function cleanNav(nav) {
  return (Array.isArray(nav) ? nav : []).filter(function (n) {
    const slug = n.slug || String(n.href || '').replace(/^#+/, '');
    return slug !== 'pricing';
  });
}

/* ---------- 处理 JSON 数据文件 ---------- */
function processJson(file) {
  if (!fs.existsSync(file)) { console.log('[skip] ' + file + ' 不存在'); return; }
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (d.settings) cleanSettings(d.settings);
  if (d.nav) d.nav = cleanNav(d.nav);
  if (d.settings && d.settings.details) cleanDetails(d.settings.details);
  if (Array.isArray(d.pages)) {
    d.pages.forEach(function (p) {
      if (typeof p.body_html === 'string') p.body_html = cleanBody(p.body_html);
    });
  }
  if (Array.isArray(d.menus)) {
    d.menus.forEach(function (m) { delete m.price; });
  }
  fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
  console.log('[ok] ' + file);
}

/* ---------- 处理 index.html 种子源 ---------- */
function processIndex(file) {
  if (!fs.existsSync(file)) { console.log('[skip] ' + file + ' 不存在'); return; }
  let h = fs.readFileSync(file, 'utf8');
  const mMain = h.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  if (mMain) {
    const cleaned = cleanBody(mMain[1]);
    h = h.replace(mMain[1], cleaned);
  }
  /* 导航里的「价格」链接（桌面 + 移动端两处） */
  h = h.replace(/<a href="#pricing"[^>]*>价格<\/a>/g, '');
  fs.writeFileSync(file, h, 'utf8');
  console.log('[ok] ' + file);
}

processJson(DATA_FILE);
processJson(INITIAL_FILE);
processIndex(INDEX_FILE);
console.log('转换完成');
