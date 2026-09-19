/* ============================================================
 * 福鲜家 CMS · 前台页面渲染
 * 共享布局（头部/页脚/图标库）由站点数据渲染；
 * 页面正文来自数据库，正文中的 data-widget 占位符被替换为
 * 「每日菜单 / 客户评价 / 套餐入口」的实际列表（数据在后台维护）；
 * 套餐二级页（/yuezi /beiyun /kongzhi /chanhou /shuhou）
 * 由 settings.planLines 数据驱动动态渲染，后台可编辑。
 * ============================================================ */
'use strict';

const store = require('./store');

/* 性能优化：仅加载 3 个字重（Regular / Medium / Demibold） */
const FONTS = [
  'https://cdn.xrbk.cn/fonts/MiSans-Regular/result.css',
  'https://cdn.xrbk.cn/fonts/MiSans-Medium/result.css',
  'https://cdn.xrbk.cn/fonts/MiSans-Demibold/result.css'
];

const FAVICON =
  'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'%3E%3Crect width=\'64\' height=\'64\' rx=\'14\' fill=\'%2370C8D0\'/%3E%3Ctext x=\'32\' y=\'44\' font-size=\'34\' text-anchor=\'middle\' fill=\'%23fff\' font-family=\'serif\' font-weight=\'bold\'%3E福%3C/text%3E%3C/svg%3E';

/* ---------- 静态资源版本号 ---------- */
let ASSET_REV = Date.now().toString(36);
function bumpAssetRev() {
  ASSET_REV = Date.now().toString(36);
}

/** 页面渲染缓存 */
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

/** 套餐二级页渲染缓存（以 slug 为键） */
const planCache = new Map();
function renderPlanLineCached(line) {
  const v = store.version() + ':' + ASSET_REV;
  const hit = planCache.get(line.slug);
  if (hit && hit.v === v) return hit.html;
  const html = renderPlanLinePage(line);
  if (planCache.size > 20) planCache.clear();
  planCache.set(line.slug, { v: v, html: html });
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

/** 手机号展示格式 */
function fmtPhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 11) return d.slice(0, 3) + ' ' + d.slice(3, 7) + ' ' + d.slice(7);
  return p || '';
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

/* ============================================================
 * 套餐方案（planLines）相关渲染
 * ============================================================ */

/** 取套餐线数组（兼容对象/数组两种存储形态；默认过滤已停用的线） */
function planLinesOf(s, opts) {
  const p = (s && s.planLines) || {};
  const arr = Array.isArray(p) ? p.slice() : Object.keys(p).map(function (k) { return p[k]; });
  if (opts && opts.includeDisabled) return arr;
  return arr.filter(function (l) { return l.enabled !== false; });
}

/** 导航项地址：多页化——首页 '/'，锚点项 '/#slug' */
function navHref(n) {
  if (n.href) return n.href;
  if (n.slug === 'top') return '/';
  return '/#' + String(n.slug || '');
}

/** 顶部导航（桌面 + 移动端，支持「套餐方案」下拉子菜单） */
function faviconHtml(s) {
  const url = (s && s.faviconUrl) || FAVICON;
  const type = String(url).toLowerCase().endsWith('.svg') ? ' type="image/svg+xml"' : '';
  return '<link rel="icon" href="' + esc(url) + '"' + type + '>';
}

function renderHeader(s, nav) {
  const phone = fmtPhone(s.phone);
  const lines = planLinesOf(s);
  const DD_ICONS = { yuezi: 'ic-bowl', beiyun: 'ic-heart', kongzhi: 'ic-leaf', chanhou: 'ic-spa', shuhou: 'ic-pulse' };
  function ddIcon(slug) { return DD_ICONS[slug] || 'ic-check'; }
  const dropdown = lines.map(function (l) {
    return '<a class="dd-link" href="/' + esc(l.slug) + '">' +
      '<svg class="dd-ic" viewBox="0 0 24 24"><use href="#' + ddIcon(l.slug) + '"/></svg>' +
      '<span class="dd-txt">' + esc(l.name) + '</span>' +
      '<svg class="dd-go" viewBox="0 0 24 24"><use href="#ic-arrow"/></svg>' +
      '</a>';
  }).join('');

  const links = nav.map(function (n) {
    if (n.slug === 'plans' && lines.length) {
      return '<div class="nav-item has-dd">' +
        '<a href="' + esc(navHref(n)) + '">' + esc(n.label) +
        '<svg class="dd-caret" viewBox="0 0 24 24"><use href="#ic-caret" xlink:href="#ic-caret"/></svg></a>' +
        '<div class="dd-menu">' + dropdown + '</div>' +
        '</div>';
    }
    return '<a href="' + esc(navHref(n)) + '">' + esc(n.label) + '</a>';
  }).join('\n      ');

  const mlinks = nav.map(function (n) {
    let sub = '';
    if (n.slug === 'plans' && lines.length) {
      sub = '<div class="mobile-sub">' + lines.map(function (l) {
        return '<a href="/' + esc(l.slug) + '">' +
          '<svg class="dd-ic" viewBox="0 0 24 24"><use href="#' + ddIcon(l.slug) + '"/></svg>' +
          '<span>' + esc(l.name) + '</span>' +
          '</a>';
      }).join('') + '</div>';
    }
    return '<a href="' + esc(navHref(n)) + '">' + esc(n.label) + '</a>' + sub;
  }).join('\n    ');

  return (
    '<header class="site-nav" id="siteNav">\n' +
    '  <div class="container nav-inner">\n' +
    '    <a class="brand" href="/" aria-label="' + esc(s.siteName) + '首页">\n' +
    (s.logoUrl
      ? '      <span class="brand-mark"><img class="brand-logo" src="' + esc(s.logoUrl) + '" alt="' + esc(s.siteName) + '"></span>\n'
      : '      <span class="brand-mark"><svg viewBox="0 0 24 24"><use href="#ic-bowl" xlink:href="#ic-bowl"/></svg></span>\n') +
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
    '    <p class="footer-links">电话 ' + esc(fmtPhone(s.phone)) + ' · 微信 ' + esc(s.wechatId) + '<span class="m-sep"> · </span>' + esc(s.address) + '</p>\n' +
    '    <p class="footer-note">' + esc(s.footerNote).replace('｜', '<span class="m-sep"> ｜ </span>') + '</p>\n' +
    '    <p class="footer-copy">© <span id="year"></span> ' + esc(s.siteName) + ' · 用心做好每一餐</p>\n' +
    (s.icp ? '    <p class="footer-icp"><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">' + esc(s.icp) + '</a></p>\n' : '') +
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

/** 站点配置注入脚本 */
function siteConfigScript(s) {
  const qrImg = s.qrUrl || '/uploads/contact/2026-09/1789571940000-6d50b470.webp';
  const cfg = {
    phone: s.phone,
    wechatId: s.wechatId,
    wechatJumpUrl: s.wechatJumpUrl,
    consultUrl: s.consultUrl,
    bookingUrl: s.bookingUrl,
    miniProgramUrl: s.miniProgramUrl,
    qrUrl: qrImg
  };
  const data = {
    details: s.details || null,
    planLines: s.planLines || null
  };
  const jsonCfg = JSON.stringify(cfg).replace(/</g, '\\u003c');
  const jsonData = JSON.stringify(data).replace(/</g, '\\u003c');
  return '<script>window.SITE_CONFIG=' + jsonCfg + ';window.SITE_DATA=' + jsonData + ';</script>';
}

/** 页面正文中的 widget 占位符替换 */
function renderWidgets(bodyHtml, data) {
  const s = data.settings || {};
  const menus = (data.menus || [])
    .filter(function (m) { return m.published !== false; })
    .sort(bySort);
  const reviews = (data.reviews || [])
    .filter(function (r) { return r.published !== false; })
    .sort(bySort);

  const menuHtml = renderMenus(menus);
  const reviewHtml = renderReviews(reviews);
  const entriesHtml = renderPlanEntries(s);
  const teamHtml = renderTeam(s.homeTeam);
  const servicesHtml = renderServices(s.homeServices);

  return String(bodyHtml)
    .replace(/<div([^>]*data-widget="menu-list"[^>]*)>[\s\S]*?<\/div>/g, function () {
      return '<div class="fxj-widget-slot" data-widget="menu-list">' + menuHtml + '</div>';
    })
    .replace(/<div([^>]*data-widget="reviews-list"[^>]*)>[\s\S]*?<\/div>/g, function () {
      return '<div class="fxj-widget-slot" data-widget="reviews-list">' + reviewHtml + '</div>';
    })
    .replace(/<div([^>]*data-widget="plan-entries"[^>]*)>[\s\S]*?<\/div>/g, function () {
      return '<div class="plan-entry-grid" data-widget="plan-entries">' + entriesHtml + '</div>';
    })
    .replace(/<div([^>]*data-widget="home-team"[^>]*)>[\s\S]*?<\/div>/g, function () {
      return '<div class="team-core" data-widget="home-team">' + teamHtml + '</div>';
    })
    .replace(/<div([^>]*data-widget="home-services"[^>]*)>[\s\S]*?<\/div>/g, function () {
      return '<div class="service-grid" data-widget="home-services">' + servicesHtml + '</div>';
    });
}

/* ============================================================
 * 首页「专家团队」（后台「站点设置 → 首页区块」数据驱动）
 * ============================================================ */
function renderTeam(team) {
  if (!team || !team.length) return '<div class="fxj-empty">暂无团队成员，请到后台「站点设置 → 首页区块」添加</div>';
  return team.map(function (m) {
    const icon = m.icon || 'ic-leaf';
    const tagHtml = m.tag ? '<span class="team-core-tag">' + esc(m.tag) + '</span>' : '';
    return (
      '<article class="team-card reveal">' +
      '<div class="team-top"><span class="team-ic"><svg viewBox="0 0 24 24"><use href="#' + icon + '"/></svg></span>' + tagHtml + '</div>' +
      '<h3>' + esc(m.name) + '</h3>' +
      '<p class="team-role">' + esc(m.role) + '</p>' +
      '<ul class="team-list">' + (m.items || []).map(function (it) {
        return '<li>' + esc(it) + '</li>';
      }).join('') + '</ul>' +
      (m.tags && m.tags.length ? '<div class="team-tags">' + m.tags.map(function (t) {
        return '<span>' + esc(t) + '</span>';
      }).join('') + '</div>' : '') +
      '</article>'
    );
  }).join('');
}

/* ============================================================
 * 首页「服务保障」（后台「站点设置 → 首页区块」数据驱动）
 * ============================================================ */
function renderServices(services) {
  if (!services || !services.length) return '<div class="fxj-empty">暂无服务项，请到后台「站点设置 → 首页区块」添加</div>';
  return services.map(function (sv) {
    const icon = sv.icon || 'ic-leaf';
    return (
      '<div class="service-item reveal"><span class="service-ic"><svg viewBox="0 0 24 24"><use href="#' + icon + '"/></svg></span>' +
      '<h3>' + esc(sv.title) + '</h3>' +
      '<p>' + esc(sv.desc) + '</p>' +
      '</div>'
    );
  }).join('');
}

/* ============================================================
 * 首页「5 条套餐线入口区」
 * ============================================================ */
function renderPlanEntries(s) {
  const lines = planLinesOf(s);
  if (!lines.length) {
    return '<div class="fxj-empty">暂无套餐方案，请到后台「站点设置 → 套餐方案」添加</div>';
  }
  return lines.map(function (l) {
    const img = l.card || l.hero || '';
    return (
      '<a class="plan-entry" href="/' + esc(l.slug) + '">' +
      (img ? '<span class="plan-entry-media"><img src="' + esc(img) + '" alt="' + esc(l.name) + '" loading="lazy"></span>' : '') +
      '<span class="plan-entry-body">' +
      '<span class="plan-entry-eyebrow">' + esc(l.sub || '') + '</span>' +
      '<strong class="plan-entry-name">' + esc(l.name) + '</strong>' +
      '<span class="plan-entry-tags">' + (l.tags || []).slice(0, 3).map(function (t) {
        return '<em>' + esc(t) + '</em>';
      }).join('') + '</span>' +
      '<span class="plan-entry-more">了解方案<svg viewBox="0 0 24 24"><use href="#ic-arrow" xlink:href="#ic-arrow"/></svg></span>' +
      '</span>' +
      '</a>'
    );
  }).join('');
}

/* ============================================================
 * 套餐二级页（planLines 数据驱动）
 * ============================================================ */

/** 短期体验卡 */
function renderShortPlans(shortPlans) {
  if (!shortPlans || !shortPlans.length) return '';
  const cards = shortPlans.map(function (sp) {
    return (
      '<div class="short-card">' +
      '<div class="short-top"><span class="short-day">' + esc(sp.days) + '</span>' +
      '<span class="short-tag">' + esc(sp.tag || '') + '</span></div>' +
      '<h3 class="short-scene">' + esc(sp.name) + '</h3>' +
      '<p class="short-featured">' + esc(sp.desc || '') + '</p>' +
      '<ul class="short-features">' + (sp.points || []).map(function (p) {
        return '<li><svg class="c-ic" viewBox="0 0 24 24"><use href="#ic-check"/></svg>' + esc(p) + '</li>';
      }).join('') + '</ul>' +
      '</div>'
    );
  }).join('');
  return (
    '<section class="section shortplans" id="shortplans">' +
    '<div class="container">' +
    '<div class="sec-head"><span class="eyebrow-center">SHORT-TERM</span>' +
    '<h2 class="sec-sub">短期体验<span class="m-sep"> · </span>给最关键的那几天</h2>' +
    '<p class="sec-lead">先体验，后升级；短期费用可全额抵扣长期套餐。</p></div>' +
    '<div class="short-grid">' + cards + '</div>' +
    '</div></section>'
  );
}

/** 三档套餐卡 + 服务模块明细 */
function renderTiers(tiers, phone) {
  if (!tiers || !tiers.length) return '';
  const cards = tiers.map(function (t) {
    const features = (t.features || []).map(function (f) {
      return '<li><svg class="c-ic" viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"/></svg>' + esc(f) + '</li>';
    }).join('');
    const modules = (t.modules || []).map(function (m) {
      const rows = (m.items || []).map(function (it) {
        return (
          '<div class="mod-row">' +
          '<div class="mod-name">' + esc(it.n) + '</div>' +
          '<div class="mod-desc">' + esc(it.d) + '</div>' +
          '<div class="mod-cycle">' + esc(it.c || '') + '</div>' +
          '</div>'
        );
      }).join('');
      return '<div class="mod-group"><h4>' + esc(m.title) + '</h4>' + rows + '</div>';
    }).join('');
    return (
      '<div class="plan-card' + (t.key === 'premium' ? ' plan-featured' : '') + '">' +
      (t.img
        ? '<div class="plan-media"><img src="' + esc(t.img) + '" alt="' + esc(t.name) + '" loading="lazy" decoding="async"><span class="plan-tag">' + esc(t.tag || '') + '</span></div>'
        : '') +
      '<div class="plan-body">' +
      '<h3>' + esc(t.name) + '</h3>' +
      '<p class="plan-desc">' + esc(t.desc || '') + '</p>' +
      '<ul class="plan-features">' + features + '</ul>' +
      '<details class="tier-details">' +
      '<summary><svg viewBox="0 0 24 24"><use href="#ic-list" xlink:href="#ic-list"/></svg>查看服务明细</summary>' +
      '<div class="tier-modules">' + modules + '</div>' +
      '</details>' +
      '<div class="plan-actions">' +
      '<a class="btn btn-outline btn-block" data-action="consult" href="tel:' + esc(phone) + '">咨询获取专属方案</a>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }).join('');
  return (
    '<section class="section plans" id="plans">' +
    '<div class="container">' +
    '<div class="sec-head"><span class="eyebrow-center">PLANS</span>' +
    '<h2 class="sec-sub">三档套餐<span class="m-sep"> · </span>总有一档适合你</h2>' +
    '<p class="sec-lead">服务逐级升级，方案按个人体质专属定制。</p></div>' +
    '<div class="plan-grid">' + cards + '</div>' +
    '</div></section>'
  );
}

/** 调理路径 / 特色阶段区（去图标、紧凑排版、每阶段轮播图） */
function renderStages(stages) {
  if (!stages || !stages.length) return '';
  const items = stages.map(function (st, i) {
    const gallery = (st.gallery || []).filter(Boolean);
    const carousel = gallery.length ? (
      '<div class="stage-gallery" data-n="' + gallery.length + '">' +
      '<div class="sg-track">' + gallery.map(function (g) {
        return '<div class="sg-slide"><img src="' + esc(g) + '" alt="' + esc(st.n) + '阶段代表菜品" decoding="async"></div>';
      }).join('') + '</div>' +
      (gallery.length > 1
        ? '<button type="button" class="sg-btn sg-prev" aria-label="上一张">‹</button>' +
          '<button type="button" class="sg-btn sg-next" aria-label="下一张">›</button>' +
          '<div class="sg-dots">' + gallery.map(function (_, di) {
            return '<i' + (di === 0 ? ' class="is-on"' : '') + '></i>';
          }).join('') + '</div>'
        : '') +
      '</div>'
    ) : '';
    return (
      '<div class="stage-card">' +
      '<div class="stage-body">' +
      '<div class="stage-top"><span class="stage-no">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<h3>' + esc(st.n) + '</h3></div>' +
      '<strong class="stage-time">' + esc(st.t) + '</strong>' +
      '<p>' + esc(st.d) + '</p>' +
      (st.dish ? '<em class="stage-dish">' + (/^代表餐品/.test(st.dish) ? '' : '代表餐品：') + esc(st.dish) + '</em>' : '') +
      '</div>' +
      carousel +
      '</div>'
    );
  }).join('');
  return (
    '<section class="section stages" id="stages">' +
    '<div class="container">' +
    '<div class="sec-head"><span class="eyebrow-center">OUR SYSTEM</span>' +
    '<h2 class="sec-sub">科学调理路径</h2>' +
    '<p class="sec-lead">按身体节奏逐级推进，不着急、不将就。</p></div>' +
    '<div class="stage-timeline">' + items + '</div>' +
    '</div>' +
    '<script>(function(){var gs=document.querySelectorAll(".stage-gallery");gs.forEach(function(g){var t=g.querySelector(".sg-track"),n=parseInt(g.getAttribute("data-n")||"1",10),i=0,tm=null;function go(k){if(n<=1)return;i=(k+n)%n;t.style.transform="translateX(-"+i*100+"%)";var ds=g.querySelectorAll(".sg-dots i");ds.forEach(function(d,x){d.classList.toggle("is-on",x===i)});}var p=g.querySelector(".sg-prev"),nx=g.querySelector(".sg-next");if(p)p.addEventListener("click",function(){go(i-1);restart()});if(nx)nx.addEventListener("click",function(){go(i+1);restart()});function restart(){if(tm)clearInterval(tm);if(n>1)tm=setInterval(function(){go(i+1)},3600);}g.addEventListener("mouseenter",function(){if(tm)clearInterval(tm)});g.addEventListener("mouseleave",restart);restart();});})();</script>' +
    '</section>'
  );
}

/** 专属方案咨询区（首页白底；二级页传 'dark' 用深蓝底白字） */
function renderQuote(s, variant) {
  const dark = variant === 'dark';
  const secCls = dark ? 'section quote-section quote-dark' : 'section quote-section';
  return (
    '<section class="' + secCls + '" id="quote">' +
    '<div class="container quote-inner">' +
    '<div class="quote-main">' +
    '<h2 class="quote-lead">专属方案<br>值得一次认真咨询</h2>' +
    '<p class="quote-sub">体质不同、需求不同，方案也因人而异。留下您的需求，营养顾问一对一为您定制。</p>' +
    '</div>' +
    '<div class="quote-actions">' +
    '<a class="btn btn-gold-lg" data-action="consult" href="tel:' + esc(s.phone) + '">咨询获取专属方案</a>' +
    '<button class="btn btn-cream-lg" id="quoteCopyWx"><svg viewBox="0 0 24 24"><use href="#ic-wechat" xlink:href="#ic-wechat"/></svg>添加微信咨询</button>' +
    '</div>' +
    '</div></section>'
  );
}

/** 五步开启 */
function renderFlow() {
  const steps = [
    { t: '在线咨询', d: '电话或微信联系，顾问了解您的具体情况' },
    { t: '体质评估', d: '到店或上门完成体质辩证与需求登记' },
    { t: '专属定制', d: '营养师按体质定制您的专属餐单' },
    { t: '每日现做', d: '开放厨房每日新鲜现做，食材公示' },
    { t: '准时送达', d: '精准时段配送，随时调整随时响应' }
  ];
  const photos = ['/img/flow1.jpg', '/img/flow2.jpg', '/img/flow3.jpg', '/img/flow4.jpg'];
  const items = steps.map(function (st, i) {
    const item = '<div class="flow-item"><span class="flow-no">' + (i + 1) + '</span><h3>' + esc(st.t) + '</h3><p>' + esc(st.d) + '</p></div>';
    if (i < 4) {
      const photo = '<div class="flow-photo" style="background-image:url(' + photos[i] + ')"></div>';
      return item + photo;
    }
    return item;
  }).join('');
  return (
    '<section class="section flow" id="flow">' +
    '<div class="container">' +
    '<div class="sec-head"><span class="eyebrow-center">HOW IT WORKS</span>' +
    '<h2 class="sec-sub">五步开启您的专属方案</h2></div>' +
    '<div class="flow-list">' + items + '</div>' +
    '</div></section>'
  );
}

/** 联系区 */
function renderContact(s) {
  const qrImg = s.qrUrl || '/uploads/contact/2026-09/1789571940000-6d50b470.webp';
  return (
    '<section class="section contact" id="contact">' +
    '<div class="container">' +
    '<div class="sec-head"><span class="eyebrow-center">CONTACT</span>' +
    '<h2 class="sec-sub">联系我们</h2></div>' +
    '<div class="contact-box">' +
    '<div class="contact-info">' +
    '<h2>不方便到店？<br>线上也能快速了解方案</h2>' +
    '<p class="contact-lead">拨打电话或添加微信，销售顾问一对一解答套餐内容、服务细节与专属调理方案。</p>' +
    '<ul class="contact-list">' +
    '<li><span class="c-ic"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"/></svg></span><p><em>咨询电话</em><a data-action="consult" href="tel:' + esc(s.phone) + '"><strong>' + esc(fmtPhone(s.phone)) + '</strong></a></p></li>' +
    '<li><span class="c-ic"><svg viewBox="0 0 24 24"><use href="#ic-wechat" xlink:href="#ic-wechat"/></svg></span><p><em>微信号</em><span class="wx-row"><strong id="wxId">' + esc(s.wechatId) + '</strong><button id="copyWx" class="btn-copy">复制</button></span></p></li>' +
    '<li><span class="c-ic"><svg viewBox="0 0 24 24"><use href="#ic-pin" xlink:href="#ic-pin"/></svg></span><p><em>门店地址</em><strong>' + esc(s.address) + '</strong></p></li>' +
    '<li><span class="c-ic"><svg viewBox="0 0 24 24"><use href="#ic-clock" xlink:href="#ic-clock"/></svg></span><p><em>营业时间</em><strong>' + esc(s.hours) + '</strong></p></li>' +
    '</ul>' +
    '</div>' +
    '<div class="contact-qr">' +
    '<img src="' + esc(qrImg) + '" alt="' + esc(s.siteName) + '微信二维码" loading="lazy">' +
    '<p><strong>扫码添加微信</strong><span>一对一咨询 · 免费试吃预约</span></p>' +
    '</div>' +
    '</div>' +
    '</div></section>'
  );
}

/** 信任条（门店实力） */
function renderTrustbar(s) {
  const chips = [
    { ic: 'ic-bowl', t: '实体门店 · 每日现做', d: '开放明厨，拒绝速冻半成品' },
    { ic: 'ic-pulse', t: '饮食需求登记', d: '一人一方，分型配餐' },
    { ic: 'ic-leaf', t: '食材每日公示', d: '全流程可溯源' },
    { ic: 'ic-spark', t: '自研 AI 健康管理', d: '经多所医学高校临床验证' }
  ];
  const items = chips.map(function (c) {
    return (
      '<div class="trust-item">' +
      '<span class="trust-ic"><svg viewBox="0 0 24 24"><use href="#' + c.ic + '"/></svg></span>' +
      '<p><strong>' + esc(c.t) + '</strong><em>' + esc(c.d) + '</em></p>' +
      '</div>'
    );
  }).join('');
  return (
    '<section class="trustbar"><div class="container trust-grid">' + items + '</div></section>'
  );
}

/** 套餐二级页完整正文 */
function renderPlanLineBody(line, s) {
  const html = [
    /* hero */
    '<section class="section plan-hero" id="top">' +
    '<div class="container plan-hero-inner">' +
    '<div class="plan-hero-copy">' +
    '<span class="eyebrow-left">福鲜家 · ' + esc(line.name) + '</span>' +
    '<h1>' + esc(line.tagline || line.name) + '</h1>' +
    '<p class="plan-hero-sub">' + esc(line.sub || '') + '</p>' +
    '<div class="hero-actions">' +
    '<a class="btn btn-gold-lg" data-action="consult" href="tel:' + esc(s.phone) + '">咨询获取专属方案</a>' +
    '<button class="btn btn-cream-lg" data-action="booking"><svg viewBox="0 0 24 24"><use href="#ic-bowl" xlink:href="#ic-bowl"/></svg>预约试吃</button>' +
    '</div>' +
    '<div class="plan-hero-tags">' + (line.tags || []).map(function (t) {
      return '<span class="plan-chip">' + esc(t) + '</span>';
    }).join('') + '</div>' +
    '</div>' +
    '<div class="plan-hero-media">' +
    (line.hero
      ? '<img src="' + esc(line.hero) + '" alt="' + esc(line.name) + '" loading="eager">'
      : '<div class="plan-hero-ph"><svg viewBox="0 0 24 24"><use href="#ic-bowl" xlink:href="#ic-bowl"/></svg></div>') +
    '</div>' +
    '</div>' +
    '</section>',

    renderTrustbar(s),

    /* 适用人群 */
    '<section class="section forwhom" id="forwhom">' +
    '<div class="container">' +
    '<div class="sec-head"><span class="eyebrow-center">FOR WHO</span>' +
    '<h2 class="sec-sub">这份方案，为谁而设</h2></div>' +
    '<div class="forwhom-grid">' + (line.forWhom || []).map(function (f) {
      return '<div class="forwhom-item"><svg class="c-ic" viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"/></svg>' + esc(f) + '</div>';
    }).join('') + '</div>' +
    '</div></section>',

    renderStages(line.stages),
    renderShortPlans(line.shortPlans),
    renderTiers(line.tiers, s.phone),
    renderQuote(s, 'dark'),
    renderFlow(),
    renderContact(s)
  ];
  return html.join('\n');
}

/** 渲染套餐二级页完整 HTML */
function renderPlanLinePage(line) {
  const d = store.load();
  const s = d.settings;
  const body = renderPlanLineBody(line, s);
  const page = {
    title: line.name + ' · ' + (line.sub || s.siteName) + '｜' + s.siteName,
    meta: line.sub + '。' + (line.tags || []).join('、') + '。' + s.siteName + '提供' + line.name + '定制配送服务。',
    body_html: body,
    needs_home_js: false
  };
  return renderPage(page);
}

/** 渲染一个完整页面 */
function renderPage(page) {
  const d = store.load();
  const s = d.settings;
  const body = renderWidgets(page.body_html, d);
  const css = page.css ? '<style>\n' + page.css + '\n</style>' : '';

  const scripts =
    (page.needs_home_js
      ? '<script src="/js/script.js?v=' + ASSET_REV + '" defer></script>'
      : '') +
    '\n<script src="/js/layout.js?v=' + ASSET_REV + '" defer></script>' +
    '\n<script src="/js/wechat-share.js?v=' + ASSET_REV + '" defer></script>';

  const fonts = FONTS.map(function (f) { return '<link rel="stylesheet" href="' + f + '">'; }).join('\n');

  return (
    '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n' +
    '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(page.title) + '</title>\n' +
    (page.meta ? '<meta name="description" content="' + esc(page.meta) + '">\n' : '') +
    faviconHtml(s) + '\n' +
    '<link rel="preconnect" href="https://cdn.xrbk.cn" crossorigin>\n' +
    fonts + '\n' +
    '<link rel="stylesheet" href="/css/style.css?v=' + ASSET_REV + '">\n' +
    '<link rel="stylesheet" href="/css/plans-extra.css?v=' + ASSET_REV + '">\n' +
    '<link rel="stylesheet" href="/css/widget.css?v=' + ASSET_REV + '">\n' +
    '<link rel="stylesheet" href="/css/mobile.css?v=' + ASSET_REV + '">\n' +
    siteConfigScript(s) + '\n' +
    scripts + '\n' +
    css + '\n' +
    '</head>\n<body>\n' +
    d.layout.svgSymbols + '\n' +
    renderHeader(s, d.nav) + '\n' +
    '<main id="top">\n' + body + '\n</main>\n' +
    renderFooter(s) + '\n' +
    '<script>(function(){var h=document.querySelector(".hero");if(h){h.style.height=window.innerHeight+"px";h.style.minHeight="0";}})();</script>' + 
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
    faviconHtml(s) + '\n' +
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

module.exports = {
  renderPage,
  renderPageCached,
  renderPlanLineCached,
  renderPlanLinePage,
  render404,
  esc,
  fmtPhone,
  bumpAssetRev,
  planLinesOf
};
