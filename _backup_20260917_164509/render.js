/* ============================================================
 * 福鲜家 CMS · 前台页面渲染
 * 共享布局（头部/页脚/图标库）由站点数据渲染；
 * 页面正文来自数据库，正文中的 data-widget 占位符被替换为
 * 「每日菜单 / 客户评价」的实际列表（数据在后台维护）
 * ============================================================ */
'use strict';

const store = require('./store');

const FONTS = [
  'https://cdn.xrbk.cn/fonts/MiSans-Thin/result.css',
  'https://cdn.xrbk.cn/fonts/MiSans-ExtraLight/result.css',
  'https://cdn.xrbk.cn/fonts/MiSans-Light/result.css',
  'https://cdn.xrbk.cn/fonts/MiSans-Normal/result.css',
  'https://cdn.xrbk.cn/fonts/MiSans-Regular/result.css',
  'https://cdn.xrbk.cn/fonts/MiSans-Medium/result.css',
  'https://cdn.xrbk.cn/fonts/MiSans-Demibold/result.css',
  'https://cdn.xrbk.cn/fonts/MiSans-Semibold/result.css',
  'https://cdn.xrbk.cn/fonts/MiSans-Bold/result.css',
  'https://cdn.xrbk.cn/fonts/MiSans-Heavy/result.css'
];

const FAVICON =
  'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'%3E%3Crect width=\'64\' height=\'64\' rx=\'14\' fill=\'%2370C8D0\'/%3E%3Ctext x=\'32\' y=\'44\' font-size=\'34\' text-anchor=\'middle\' fill=\'%23fff\' font-family=\'serif\' font-weight=\'bold\'%3E福%3C/text%3E%3C/svg%3E';

/* ---------- 静态资源版本号 ----------
 * 后台每次保存内容都会递增，CSS/JS 的 URL 变为 /css/style.css?v=新值，
 * EdgeOne/CDN 视为新资源立即回源，改完即生效，无需等 TTL。 */
let ASSET_REV = Date.now().toString(36);
function bumpAssetRev() {
  ASSET_REV = Date.now().toString(36);
}

/** 页面渲染缓存：数据或版本号变化时自动失效，前台响应快、负载低 */
const pageCache = new Map();
function renderPageCached(page) {
  const v = store.version() + ':' + ASSET_REV;
  const hit = pageCache.get(page.id);
  if (hit && hit.v === v) return hit.html;
  const html = renderPage(page);
  if (pageCache.size > 20) pageCache.clear();
  pageCache.set(page.id, { v: v, html: html });
  return html;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 手机号展示格式：13800138000 -> 138 0013 8000 */
function fmtPhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 11) return d.slice(0, 3) + ' ' + d.slice(3, 7) + ' ' + d.slice(7);
  return p || '';
}

/** 页面正文中的 widget 占位符替换为真实列表 */
function renderWidgets(bodyHtml, data) {
  const menus = data.menus
    .filter(function (m) { return m.published !== false; })
    .sort(bySort);
  const reviews = data.reviews
    .filter(function (r) { return r.published !== false; })
    .sort(bySort);

  const menuHtml = renderMenus(menus);
  const reviewHtml = renderReviews(reviews);

  return String(bodyHtml)
    .replace(/<div([^>]*data-widget="menu-list"[^>]*)>[\s\S]*?<\/div>/g, function () {
      return '<div class="fxj-widget-slot" data-widget="menu-list">' + menuHtml + '</div>';
    })
    .replace(/<div([^>]*data-widget="reviews-list"[^>]*)>[\s\S]*?<\/div>/g, function () {
      return '<div class="fxj-widget-slot" data-widget="reviews-list">' + reviewHtml + '</div>';
    });
}

function bySort(a, b) {
  const sa = a.sort == null ? 100 : Number(a.sort);
  const sb = b.sort == null ? 100 : Number(b.sort);
  if (sa !== sb) return sa - sb;
  return String(a.created_at || '').localeCompare(String(b.created_at || ''));
}

function renderMenus(menus) {
  if (!menus.length) {
    return '<div class="fxj-empty">暂无菜单数据，请到后台「条目管理 → 每日菜单」添加</div>';
  }
  let html = '<div class="fxj-menu-list">';
  menus.forEach(function (m) {
    const items = String(m.items || '')
      .split(/\r?\n/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean)
      .map(function (s) { return '<li>' + esc(s) + '</li>'; })
      .join('');
    html +=
      '<div class="fxj-menu-item">' +
      '<div class="fxj-menu-head"><span class="fxj-menu-date">' + esc(m.date || '') + '</span>' +
      '<span class="fxj-menu-meal">' + esc(m.meal || '') + '</span>' +
      (m.price ? '<span class="fxj-menu-price">' + esc(m.price) + '</span>' : '') +
      '</div>' +
      (items ? '<ul class="fxj-menu-items">' + items + '</ul>' : '') +
      '</div>';
  });
  return html + '</div>';
}

function renderReviews(reviews) {
  if (!reviews.length) {
    return '<div class="fxj-empty">暂无评价数据，请到后台「条目管理 → 客户评价」添加</div>';
  }
  let html = '<div class="fxj-reviews-list">';
  reviews.forEach(function (r) {
    const n = Math.max(0, Math.min(5, Number(r.rating) || 0));
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < n ? '★' : '☆';
    html +=
      '<div class="fxj-review-card">' +
      '<div class="fxj-review-head"><span class="fxj-review-name">' + esc(r.name || '匿名客户') + '</span>' +
      '<span class="fxj-review-stars">' + stars + '</span></div>' +
      '<p class="fxj-review-content">' + esc(r.content || '') + '</p>' +
      (r.date ? '<div class="fxj-review-date">' + esc(r.date) + '</div>' : '') +
      '</div>';
  });
  return html + '</div>';
}

/** 导航项渲染地址：优先 slug（后台新版），兼容旧 href（迁移前数据） */
function navHref(n) {
  if (n.href) return n.href;
  return '#' + String(n.slug || '');
}

/** 顶部导航（桌面 + 移动端） */
function renderHeader(s, nav) {
  const phone = fmtPhone(s.phone);
  const links = nav.map(function (n) {
    return '<a href="' + esc(navHref(n)) + '">' + esc(n.label) + '</a>';
  }).join('\n      ');
  const mlinks = nav.map(function (n) {
    return '<a href="' + esc(navHref(n)) + '">' + esc(n.label) + '</a>';
  }).join('\n    ');
  return (
    '<header class="site-nav" id="siteNav">\n' +
    '  <div class="container nav-inner">\n' +
    '    <a class="brand" href="#top" aria-label="' + esc(s.siteName) + '首页">\n' +
    '      <span class="brand-mark"><svg viewBox="0 0 24 24"><use href="#ic-bowl" xlink:href="#ic-bowl"/></svg></span>\n' +
    '      <span class="brand-text">\n' +
    '        <strong>' + esc(s.siteName) + '</strong>\n' +
    '        <em>' + esc(s.siteSub) + '</em>\n' +
    '      </span>\n' +
    '    </a>\n' +
    '    <nav class="nav-links" id="navLinks" aria-label="主导航">\n      ' + links + '\n    </nav>\n' +
    '    <div class="nav-cta">\n' +
    '      <a class="btn btn-ghost btn-sm nav-tel" data-action="consult" href="tel:' + esc(s.phone) + '">\n' +
    '        <svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"/></svg><span>' + esc(phone) + '</span>\n' +
    '      </a>\n' +
    '      <button class="nav-burger" id="navBurger" aria-label="打开菜单" aria-expanded="false">\n' +
    '        <span></span><span></span><span></span>\n' +
    '      </button>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div class="mobile-menu" id="mobileMenu" hidden>\n    ' + mlinks + '\n' +
    '    <a class="btn btn-gold" data-action="consult" href="tel:' + esc(s.phone) + '">立即电话咨询</a>\n' +
    '  </div>\n' +
    '</header>'
  );
}

function renderFooter(s) {
  return (
    '<footer class="site-footer">\n' +
    '  <div class="container footer-inner">\n' +
    '    <p class="footer-brand">' + esc(s.siteName) + ' · ' + esc(s.siteSub) + '</p>\n' +
    '    <p class="footer-links">电话 ' + esc(fmtPhone(s.phone)) + ' · 微信 ' + esc(s.wechatId) + ' · ' + esc(s.address) + '</p>\n' +
    '    <p class="footer-note">' + esc(s.footerNote) + '</p>\n' +
    '    <p class="footer-copy">© <span id="year"></span> ' + esc(s.siteName) + ' · 用心做好每一餐</p>\n' +
    '  </div>\n' +
    '</footer>\n' +
    '<div class="mobile-cta" id="mobileCta">\n' +
    '  <a class="mcta mcta-tel" data-action="consult" href="tel:' + esc(s.phone) + '"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"/></svg>电话咨询</a>\n' +
    '  <button class="mcta mcta-wx" id="mctaWx"><svg viewBox="0 0 24 24"><use href="#ic-wechat" xlink:href="#ic-wechat"/></svg>复制微信</button>\n' +
    '</div>\n' +
    '<div class="modal" id="planModal" hidden>\n' +
    '  <div class="modal-backdrop" data-close-modal></div>\n' +
    '  <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modalTitle">\n' +
    '    <button class="modal-close" data-close-modal aria-label="关闭"><svg viewBox="0 0 24 24"><use href="#ic-close" xlink:href="#ic-close"/></svg></button>\n' +
    '    <h2 id="modalTitle">套餐详情</h2>\n' +
    '    <div id="modalBody" class="modal-body"></div>\n' +
    '    <div class="modal-foot">\n' +
    '      <a class="btn btn-gold" data-action="consult" href="tel:' + esc(s.phone) + '"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"/></svg>电话咨询</a>\n' +
    '      <button class="btn btn-deep" id="modalCopyWx"><svg viewBox="0 0 24 24"><use href="#ic-wechat" xlink:href="#ic-wechat"/></svg>复制微信号</button>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n' +
    '<div class="toast" id="toast" role="status" aria-live="polite"></div>'
  );
}

/** 站点配置注入脚本（前端 layout.js 读取） */
function siteConfigScript(s) {
  const cfg = {
    phone: s.phone,
    wechatId: s.wechatId,
    wechatJumpUrl: s.wechatJumpUrl,
    consultUrl: s.consultUrl,
    bookingUrl: s.bookingUrl,
    miniProgramUrl: s.miniProgramUrl
  };
  const data = {
    prices: s.prices || null,
    details: s.details || null,
    mealTypes: (s.pricesMeta && s.pricesMeta.mealTypes) || ['每日两餐', '每日三餐', '每日两餐两点', '每日三餐两点'],
    tierNames: (s.pricesMeta && s.pricesMeta.tierNames) || ['标准调养', '定制调理', '专属私配']
  };
  const jsonCfg = JSON.stringify(cfg).replace(/</g, '\\u003c');
  const jsonData = JSON.stringify(data).replace(/</g, '\\u003c');
  return '<script>window.SITE_CONFIG=' + jsonCfg + ';window.SITE_DATA=' + jsonData + ';</script>';
}

/** 渲染一个完整页面 */
function renderPage(page) {
  const d = store.load();
  const s = d.settings;
  const body = renderWidgets(page.body_html, d);
  const css = page.css ? '<style>\n' + page.css + '\n</style>' : '';

  const scripts =
    (page.needs_home_js
      ? '<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js" defer></script>\n<script src="/js/script.js?v=' + ASSET_REV + '" defer></script>'
      : '') +
    '\n<script src="/js/layout.js?v=' + ASSET_REV + '" defer></script>';

  const fonts = FONTS.map(function (f) { return '<link rel="stylesheet" href="' + f + '">'; }).join('\n');

  return (
    '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(page.title) + '</title>\n' +
    (page.meta ? '<meta name="description" content="' + esc(page.meta) + '">\n' : '') +
    '<link rel="icon" href="' + FAVICON + '">\n' +
    '<link rel="preconnect" href="https://cdn.xrbk.cn" crossorigin>\n' +
    fonts + '\n' +
    '<link rel="stylesheet" href="/css/style.css?v=' + ASSET_REV + '">\n' +
    '<link rel="stylesheet" href="/css/widget.css?v=' + ASSET_REV + '">\n' +
    siteConfigScript(s) + '\n' +
    scripts + '\n' +
    css + '\n' +
    '</head>\n<body>\n' +
    d.layout.svgSymbols + '\n' +
    renderHeader(s, d.nav) + '\n' +
    '<main id="top">\n' + body + '\n</main>\n' +
    renderFooter(s) + '\n' +
    '</body>\n</html>'
  );
}

function render404() {
  const d = store.load();
  const s = d.settings;
  return (
    '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>页面不存在 · ' + esc(s.siteName) + '</title>\n' +
    '<link rel="stylesheet" href="/css/style.css?v=' + ASSET_REV + '">\n' +
    '<link rel="stylesheet" href="/css/widget.css?v=' + ASSET_REV + '">\n' +
    '</head>\n<body style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F6F8F7;">\n' +
    '<div style="text-align:center;padding:40px 20px;max-width:520px;">\n' +
    '<div style="font-size:64px;font-weight:700;color:#7EBDBA;">404</div>\n' +
    '<h2 style="color:#25322E;margin:8px 0 12px;">页面不存在或已下线</h2>\n' +
    '<p style="color:#57625E;margin:0 0 20px;">您访问的地址可能有误，或页面已被删除。</p>\n' +
    '<a class="btn btn-deep" href="/" style="display:inline-block;">返回首页</a>\n' +
    '</div>\n</body>\n</html>'
  );
}

module.exports = { renderPage, renderPageCached, render404, esc, fmtPhone, bumpAssetRev };
