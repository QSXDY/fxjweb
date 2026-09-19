/* ============================================================
 * 福鲜家 CMS · 服务入口
 * 前台页面渲染 + /admin 可视化后台（GrapesJS）
 * 部署：node server.js（建议 PM2 守护），端口默认 3000（PORT 环境变量可改）
 * ============================================================ */
'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const sharp = require('sharp');

const store = require('./src/store');
const auth = require('./src/auth');
const render = require('./src/render');
const build = require('./src/build');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

/* ============================================================
 * 启动初始化
 * ============================================================ */

/** 容器首启：挂载卷为空时，从镜像内模板目录拷贝初始文件 */
function copyDirIfEmpty(src, dst) {
  if (!fs.existsSync(src)) return;
  if (fs.existsSync(dst)) {
    try { if (fs.readdirSync(dst).length) return; } catch (e) { return; }
  }
  fs.mkdirSync(dst, { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
  console.log('[init] 已从模板初始化目录: ' + dst);
}
function ensureRuntimeDirs() {
  copyDirIfEmpty(path.join(ROOT, 'dist-template'), path.join(ROOT, 'dist'));
  copyDirIfEmpty(path.join(ROOT, 'public', 'uploads-template'), path.join(ROOT, 'public', 'uploads'));
}

/** 旧版平铺上传文件归位：uploads/*.ext -> uploads/general/<YYYY-MM>/（placeholder.svg 等保留原位） */
function migrateUploads() {
  const dir = path.join(ROOT, 'public', 'uploads');
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function (f) {
    const full = path.join(dir, f);
    if (!fs.statSync(full).isFile()) return;
    if (!/\.(jpe?g|png|webp|gif)$/i.test(f)) return;
    const t = fs.statSync(full).mtime;
    const ym = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0');
    const target = path.join(dir, 'general', ym);
    fs.mkdirSync(target, { recursive: true });
    fs.renameSync(full, path.join(target, f));
    console.log('[migrate] 上传文件归位: uploads/general/' + ym + '/' + f);
  });
}

/** 导航 slug 化迁移：老数据 href:"#team" -> slug:"team"，并预置只读首页项 */
function migrateNav(d) {
  const HOME = { id: 'nav_home', label: '首页', slug: 'top', fixed: true };
  let changed = false;
  let list = Array.isArray(d.nav) ? d.nav : [];
  list = list.map(function (n) {
    if (!n.slug) {
      let slug = String(n.href || '').trim().replace(/^#+/, '').replace(/^\/+/, '').toLowerCase();
      if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(slug)) slug = '';
      if (slug) {
        changed = true;
        return { id: n.id, label: n.label, slug: slug, fixed: !!n.fixed };
      }
    }
    return n;
  }).filter(function (n) { return n.label && n.slug; });
  const seen = {};
  list = list.filter(function (n) {
    if (!n.slug || seen[n.slug]) return false;
    seen[n.slug] = true;
    return true;
  });
  if (!list.some(function (n) { return n.fixed && n.slug === 'top'; })) {
    list.unshift(HOME);
    changed = true;
  }
  if (changed) d.nav = list;
  return changed;
}

ensureRuntimeDirs();
migrateUploads();
const d0 = store.load();
if (migrateNav(d0)) store.save();
build.buildDist();

/** 数据变更后统一动作：静态资源版本号 +1、重新生成 dist 成品 */
function afterChange() {
  render.bumpAssetRev();
  build.buildDist();
}

const app = express();
app.disable('x-powered-by');

/* gzip 压缩所有响应（HTML/CSS/JS/JSON），显著降低传输体积、提升响应速度 */
app.use(compression({ threshold: 512 }));

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: false }));

const secret = store.load().secret;
app.use(
  session({
    secret: secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 12 * 60 * 60 * 1000 }
  })
);

/* ---------- 静态资源 ----------
 * 前台 css/js/图片长缓存（配合 EdgeOne：URL 带版本号，内容变更即换新）；
 * 后台界面 no-cache，保证升级后立即可见。 */
const longCache = {
  setHeaders: function (res) {
    res.set('Cache-Control', 'public, max-age=86400');
  }
};
const noCache = {
  setHeaders: function (res) {
    res.set('Cache-Control', 'no-cache');
  }
};
app.use('/css', express.static(path.join(ROOT, 'css'), longCache));
app.use('/js', express.static(path.join(ROOT, 'js'), longCache));
app.use('/assets', express.static(path.join(ROOT, 'assets'), longCache));
app.use('/img', express.static(path.join(ROOT, 'public', 'img'), longCache));
app.use('/uploads', express.static(path.join(ROOT, 'public', 'uploads'), longCache));
/* 后台资源：仅放行 css/js/图片等，HTML 页面必须经登录路由渲染 */
app.use('/admin/assets', function (req, res, next) {
  if (/\.html?$/i.test(req.path)) return res.status(404).end();
  next();
}, express.static(path.join(ROOT, 'public', 'admin'), noCache));

/* ---------- 后台页面 ---------- */
function adminPage(name, tokens) {
  const file = path.join(ROOT, 'public', 'admin', name);
  let html = fs.readFileSync(file, 'utf8');
  /* 侧边栏公共组件：从 sidebar.html 加载，替换 {{SIDEBAR}} 占位符 */
  const sidebarFile = path.join(ROOT, 'public', 'admin', 'sidebar.html');
  let sidebarHtml = '';
  if (fs.existsSync(sidebarFile)) {
    sidebarHtml = fs.readFileSync(sidebarFile, 'utf8');
  }
  /* 站点 LOGO / Favicon 受后台「站点设置」控制：登录页与侧边栏 LOGO 同步跟随 */
  const s = store.load().settings || {};
  const logoUrl = String(s.logoUrl || '').trim();
  const favUrl = String(s.faviconUrl || '').trim();
  const escHtml = function (v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
  const all = Object.assign({
    CSRF: '', PAGE_JSON: 'null', PAGE_ID: '', PAGE_URL: '/',
    LOGIN_LOGO: logoUrl
      ? '<img class="login-logo login-logo-img" src="' + escHtml(logoUrl) + '" alt="站点LOGO">'
      : '<div class="login-logo">福</div>',
    SIDE_LOGO: logoUrl
      ? '<img class="side-logo side-logo-img" src="' + escHtml(logoUrl) + '" alt="站点LOGO">'
      : '<span class="side-logo">福</span>',
    FAVICON_TAG: favUrl
      ? '<link rel="icon" href="' + escHtml(favUrl) + (favUrl.toLowerCase().endsWith('.svg') ? '" type="image/svg+xml">' : '">')
      : '',
    SIDEBAR: sidebarHtml
  }, tokens || {});
  /* 先替换 sidebar.html 里的占位符（如 {{SIDE_LOGO}}） */
  Object.keys(all).forEach(function (k) {
    sidebarHtml = sidebarHtml.split('{{' + k + '}}').join(String(all[k]));
  });
  all.SIDEBAR = sidebarHtml;
  /* 再替换 HTML 里的占位符 */
  Object.keys(all).forEach(function (k) {
    html = html.split('{{' + k + '}}').join(String(all[k]));
  });
  return html;
}

app.get('/admin/login', function (req, res) {
  if (req.session && req.session.user) return res.redirect('/admin');
  res.set('Cache-Control', 'no-store').send(adminPage('login.html'));
});

app.post('/admin/login', function (req, res) {
  const user = String(req.body.user || '').trim();
  const pass = String(req.body.pass || '');
  const r = auth.checkLogin(user, pass);
  if (!r.ok) return res.status(401).json({ ok: false, error: r.reason });
  req.session.regenerate(function (err) {
    if (err) return res.status(500).json({ ok: false, error: '登录失败，请重试' });
    req.session.user = store.load().admin.user;
    req.session.csrf = crypto.randomBytes(24).toString('hex');
    res.json({ ok: true, csrf: req.session.csrf });
  });
});

app.post('/admin/logout', auth.requireAdmin, function (req, res) {
  req.session.destroy(function () {
    res.json({ ok: true });
  });
});

app.get('/admin', auth.requireAdmin, function (req, res) {
  res.set('Cache-Control', 'no-store').send(adminPage('dashboard.html', { CSRF: req.session.csrf }));
});
app.get('/admin/pages', auth.requireAdmin, function (req, res) {
  res.set('Cache-Control', 'no-store').send(adminPage('pages.html', { CSRF: req.session.csrf }));
});
app.get('/admin/entries', auth.requireAdmin, function (req, res) {
  res.set('Cache-Control', 'no-store').send(adminPage('entries.html', { CSRF: req.session.csrf }));
});
app.get('/admin/wechat', auth.requireAdmin, function (req, res) {
  res.set('Cache-Control', 'no-store').send(adminPage('wechat.html', { CSRF: req.session.csrf }));
});
app.get('/admin/settings', auth.requireAdmin, function (req, res) {
  res.set('Cache-Control', 'no-store').send(adminPage('settings.html', { CSRF: req.session.csrf }));
});
app.get('/admin/pages/:id/edit', auth.requireAdmin, function (req, res) {
  const d = store.load();
  const page = d.pages.find(function (p) { return p.id === req.params.id; });
  if (!page) return res.redirect('/admin/pages');
  const pageJson = JSON.stringify(page).replace(/</g, '\\u003c');
  const pageUrl = '/' + page.slug;
  res
    .set('Cache-Control', 'no-store')
    .send(
      adminPage('editor.html', {
        CSRF: req.session.csrf,
        PAGE_JSON: pageJson,
        PAGE_ID: page.id,
        PAGE_URL: pageUrl
      })
    );
});

/* ---------- 后台 API ---------- */
function apiOk(res, data) {
  res.json(Object.assign({ ok: true }, data || {}));
}
function apiErr(res, status, msg) {
  res.status(status).json({ ok: false, error: msg });
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,49}$/;

app.get('/admin/api/counts', auth.requireAdmin, function (req, res) {
  const d = store.load();
  apiOk(res, {
    pages: d.pages.length,
    menus: d.menus.length,
    reviews: d.reviews.length
  });
});

/* 页面 */
app.get('/admin/api/pages', auth.requireAdmin, function (req, res) {
  const d = store.load();
  const pl = render.planLinesOf(d.settings, { includeDisabled: true });
  const planPages = pl.map(function (l) {
    return {
      id: 'plan:' + l.slug,
      is_plan_line: true,
      title: l.name,
      slug: l.slug,
      published: l.enabled !== false,
      updated_at: ''
    };
  });
  apiOk(res, { pages: d.pages.concat(planPages) });
});

/* 套餐二级页：启用 / 停用 */
app.post('/admin/api/pages/plan-toggle', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const slug = String(req.body.slug || '').trim().toLowerCase();
  if (!slug || !SLUG_RE.test(slug)) return apiErr(res, 400, '网址格式不正确');
  store.mutate(function (d) {
    const pl = (d.settings.planLines && typeof d.settings.planLines === 'object') ? d.settings.planLines : {};
    if (!pl[slug]) throw new Error('该套餐二级页不存在');
    pl[slug].enabled = req.body.published !== false;
  });
  afterChange();
  apiOk(res, { ok: true });
});

app.post('/admin/api/pages', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const title = String(req.body.title || '').trim().slice(0, 100);
  const slug = String(req.body.slug || '').trim().toLowerCase();
  if (!title) return apiErr(res, 400, '请填写页面标题');
  if (!slug || !SLUG_RE.test(slug)) return apiErr(res, 400, '网址只能包含小写字母、数字和短横线（如 menu、yuyue）');
  const d = store.load();
  if (d.pages.some(function (p) { return p.slug === slug; })) return apiErr(res, 400, '该网址已被使用，请换一个');
  const pl = (d.settings.planLines && typeof d.settings.planLines === 'object') ? d.settings.planLines : {};
  if (pl[slug]) return apiErr(res, 400, '该网址已被「套餐方案」二级页使用，请换一个');
  const page = {
    id: store.newId('p'),
    title: title,
    slug: slug,
    meta: String(req.body.meta || '').trim().slice(0, 300),
    body_html:
      '<div class="fxj-editable" style="max-width:960px;margin:0 auto;padding:56px 20px;">' +
      '<h2 style="margin:0 0 16px;">' + title + '</h2>' +
      '<p style="margin:0;color:#57625E;">这是一个新页面。点击左侧「区块」标签，把文本、图片、按钮等拖到这里开始编辑；保存后刷新前台即可看到。</p>' +
      '</div>',
    css: '',
    published: true,
    is_home: false,
    needs_home_js: false,
    created_at: store.now(),
    updated_at: store.now()
  };
  store.mutate(function (data) { data.pages.push(page); });
  afterChange();
  apiOk(res, { id: page.id });
});

app.post('/admin/api/pages/:id/save', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const d = store.load();
  const page = d.pages.find(function (p) { return p.id === req.params.id; });
  if (!page) return apiErr(res, 404, '页面不存在');
  const title = String(req.body.title || '').trim().slice(0, 100);
  if (!title) return apiErr(res, 400, '请填写页面标题');
  page.title = title;
  page.meta = String(req.body.meta || '').trim().slice(0, 300);
  page.body_html = String(req.body.body_html || '');
  page.css = String(req.body.css || '');
  page.published = req.body.published !== false;
  page.updated_at = store.now();
  store.save();
  afterChange();
  apiOk(res);
});

app.post('/admin/api/pages/:id/delete', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const d = store.load();
  const idx = d.pages.findIndex(function (p) { return p.id === req.params.id; });
  if (idx < 0) return apiErr(res, 404, '页面不存在');
  if (d.pages[idx].is_home) return apiErr(res, 400, '首页不可删除');
  d.pages.splice(idx, 1);
  store.save();
  afterChange();
  apiOk(res);
});

/* 条目通用工具 */
function listEntries(kind) {
  const d = store.load();
  return d[kind] || [];
}
function findEntry(kind, id) {
  const d = store.load();
  const idx = d[kind].findIndex(function (e) { return e.id === id; });
  return idx >= 0 ? { idx: idx, item: d[kind][idx] } : null;
}
function moveEntry(kind, id, dir) {
  return store.mutate(function (d) {
    const arr = d[kind];
    const idx = arr.findIndex(function (e) { return e.id === id; });
    if (idx < 0) return false;
    const target = idx + (dir === -1 ? -1 : 1);
    if (target < 0 || target >= arr.length) return false;
    const t = arr[idx];
    arr[idx] = arr[target];
    arr[target] = t;
    return true;
  });
}

/* 每日菜单 */
app.get('/admin/api/menus', auth.requireAdmin, function (req, res) {
  apiOk(res, { items: listEntries('menus') });
});
app.post('/admin/api/menus', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const item = {
    id: store.newId('m'),
    date: String(req.body.date || '').trim().slice(0, 40),
    meal: String(req.body.meal || '').trim().slice(0, 20),
    items: String(req.body.items || '').trim().slice(0, 2000),
    sort: store.load().menus.length,
    published: req.body.published !== false,
    created_at: store.now()
  };
  store.mutate(function (d) { d.menus.push(item); });
  afterChange();
  apiOk(res, { id: item.id });
});
app.post('/admin/api/menus/:id/save', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const found = findEntry('menus', req.params.id);
  if (!found) return apiErr(res, 404, '记录不存在');
  const item = found.item;
  item.date = String(req.body.date || '').trim().slice(0, 40);
  item.meal = String(req.body.meal || '').trim().slice(0, 20);
  item.items = String(req.body.items || '').trim().slice(0, 2000);
  item.published = req.body.published !== false;
  store.save();
  afterChange();
  apiOk(res);
});
app.post('/admin/api/menus/:id/delete', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  store.mutate(function (d) {
    const idx = d.menus.findIndex(function (e) { return e.id === req.params.id; });
    if (idx >= 0) d.menus.splice(idx, 1);
  });
  afterChange();
  apiOk(res);
});
app.post('/admin/api/menus/:id/move', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const dir = req.body.dir === -1 ? -1 : 1;
  afterChange();
  apiOk(res, { moved: moveEntry('menus', req.params.id, dir) });
});

/* 客户评价 */
app.get('/admin/api/reviews', auth.requireAdmin, function (req, res) {
  apiOk(res, { items: listEntries('reviews') });
});
app.post('/admin/api/reviews', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const item = {
    id: store.newId('r'),
    name: String(req.body.name || '').trim().slice(0, 50),
    rating: Math.max(1, Math.min(5, Number(req.body.rating) || 5)),
    content: String(req.body.content || '').trim().slice(0, 1000),
    date: String(req.body.date || '').trim().slice(0, 40),
    sort: store.load().reviews.length,
    published: req.body.published !== false,
    created_at: store.now()
  };
  store.mutate(function (d) { d.reviews.push(item); });
  afterChange();
  apiOk(res, { id: item.id });
});
app.post('/admin/api/reviews/:id/save', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const found = findEntry('reviews', req.params.id);
  if (!found) return apiErr(res, 404, '记录不存在');
  const item = found.item;
  item.name = String(req.body.name || '').trim().slice(0, 50);
  item.rating = Math.max(1, Math.min(5, Number(req.body.rating) || 5));
  item.content = String(req.body.content || '').trim().slice(0, 1000);
  item.date = String(req.body.date || '').trim().slice(0, 40);
  item.published = req.body.published !== false;
  store.save();
  afterChange();
  apiOk(res);
});
app.post('/admin/api/reviews/:id/delete', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  store.mutate(function (d) {
    const idx = d.reviews.findIndex(function (e) { return e.id === req.params.id; });
    if (idx >= 0) d.reviews.splice(idx, 1);
  });
  afterChange();
  apiOk(res);
});
app.post('/admin/api/reviews/:id/move', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const dir = req.body.dir === -1 ? -1 : 1;
  afterChange();
  apiOk(res, { moved: moveEntry('reviews', req.params.id, dir) });
});

/* 站点设置 */
const SETTING_KEYS = [
  'siteName', 'siteSub', 'phone', 'wechatId', 'wechatJumpUrl',
  'consultUrl', 'bookingUrl', 'miniProgramUrl', 'address', 'hours', 'footerNote', 'icp',
  'logoUrl', 'faviconUrl', 'qrUrl'
];
app.get('/admin/api/settings', auth.requireAdmin, function (req, res) {
  const d = store.load();
  apiOk(res, { settings: d.settings, nav: d.nav });
});
app.post('/admin/api/settings', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  store.mutate(function (d) {
    SETTING_KEYS.forEach(function (k) {
      if (typeof req.body[k] === 'string') d.settings[k] = req.body[k].trim().slice(0, 500);
    });
    if (req.body.details && typeof req.body.details === 'object') d.settings.details = req.body.details;
    if (req.body.details === null) d.settings.details = null;
    if (Array.isArray(req.body.homeTeam)) {
      d.settings.homeTeam = req.body.homeTeam
        .filter(function (m) { return m && typeof m === 'object' && String(m.name || '').trim(); })
        .map(function (m) {
          return {
            icon: String(m.icon || 'ic-leaf').slice(0, 40),
            tag: String(m.tag || '').trim().slice(0, 40),
            name: String(m.name || '').trim().slice(0, 60),
            role: String(m.role || '').trim().slice(0, 120),
            items: Array.isArray(m.items) ? m.items.map(function (x) { return String(x).trim().slice(0, 300); }).filter(Boolean).slice(0, 12) : [],
            tags: Array.isArray(m.tags) ? m.tags.map(function (x) { return String(x).trim().slice(0, 60); }).filter(Boolean).slice(0, 8) : []
          };
        });
    }
    if (Array.isArray(req.body.homeServices)) {
      d.settings.homeServices = req.body.homeServices
        .filter(function (s) { return s && typeof s === 'object' && String(s.title || '').trim(); })
        .map(function (s) {
          return {
            icon: String(s.icon || 'ic-leaf').slice(0, 40),
            title: String(s.title || '').trim().slice(0, 120),
            desc: String(s.desc || '').trim().slice(0, 300)
          };
        });
    }
    if (req.body.planLines && typeof req.body.planLines === 'object' && !Array.isArray(req.body.planLines)) {
      // 结构化校验：slug 合法、name 非空
      const pl = req.body.planLines;
      const out = {};
      Object.keys(pl).forEach(function (k) {
        const l = pl[k] && typeof pl[k] === 'object' ? pl[k] : {};
        if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(k)) return;
        if (!String(l.name || '').trim()) return;
        out[k] = l;
      });
      if (Object.keys(out).length) d.settings.planLines = out;
      else throw new Error('套餐方案格式有误：至少保留一条有效餐线');
    }
    if (req.body.planLines === null) d.settings.planLines = null;
  });
  afterChange();
  apiOk(res);
});

/* 套餐二级页：实时预览（不落库，直接用表单数据渲染） */

/* ===== 微信分享 API ===== */
app.get('/admin/api/wechat', auth.requireAdmin, function (req, res) {
  const d = store.load();
  apiOk(res, d.wechat || {});
});
app.post('/admin/api/wechat', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  store.mutate(function (d) {
    d.wechat = {
      appId: String(req.body.appId || '').trim(),
      appSecret: String(req.body.appSecret || '').trim(),
      title: String(req.body.title || '').trim(),
      desc: String(req.body.desc || '').trim(),
      img: String(req.body.img || '').trim()
    };
  });
  apiOk(res, { ok: true });
});

/* ===== 微信 JSSDK 签名接口（前台调用） ===== */
const https = require('https');
/* access_token / jsapi_ticket 缓存：按 appId 隔离，配置变更后自动失效 */
let wxTokenCache = {};   // appId -> { token, expire }
let wxTicketCache = {};  // appId -> { ticket, expire }

function httpsGet(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, function (res) {
      let data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('解析失败')); }
      });
    }).on('error', reject);
  });
}

async function getWxAccessToken(appId, appSecret) {
  const now = Date.now();
  const cached = wxTokenCache[appId];
  if (cached && cached.expire > now) return cached.token;
  const url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=' + appId + '&secret=' + appSecret;
  const data = await httpsGet(url);
  if (data.errcode) throw new Error(data.errmsg || '获取 access_token 失败');
  wxTokenCache[appId] = { token: data.access_token, expire: now + (data.expires_in - 300) * 1000 };
  return data.access_token;
}

async function getWxTicket(appId, accessToken) {
  const now = Date.now();
  const cached = wxTicketCache[appId];
  if (cached && cached.expire > now) return cached.ticket;
  const url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + accessToken + '&type=jsapi';
  const data = await httpsGet(url);
  if (data.errcode) throw new Error(data.errmsg || '获取 ticket 失败');
  wxTicketCache[appId] = { ticket: data.ticket, expire: now + (data.expires_in - 300) * 1000 };
  return data.ticket;
}

app.get('/api/wechat/sign', async function (req, res) {
  try {
    const d = store.load();
    const wc = d.wechat || {};
    if (!wc.appId || !wc.appSecret) {
      return res.json({ ok: false, error: '未配置微信分享' });
    }
    const url = req.query.url || '';
    const accessToken = await getWxAccessToken(wc.appId, wc.appSecret);
    const ticket = await getWxTicket(wc.appId, accessToken);
    const nonceStr = Math.random().toString(36).substring(2, 15);
    const timestamp = Math.floor(Date.now() / 1000);
    const string1 = 'jsapi_ticket=' + ticket + '&noncestr=' + nonceStr + '&timestamp=' + timestamp + '&url=' + url;
    const signature = require('crypto').createHash('sha1').update(string1).digest('hex');
    res.json({
      ok: true,
      appId: wc.appId,
      timestamp: timestamp,
      nonceStr: nonceStr,
      signature: signature,
      title: wc.title || '',
      desc: wc.desc || '',
      img: wc.img || ''
    });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.post('/admin/api/plan-preview', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const line = req.body.line;
  if (!line || typeof line !== 'object') return apiErr(res, 400, '缺少套餐数据');
  const slug = String(line.slug || '').trim().toLowerCase();
  if (!slug || !SLUG_RE.test(slug)) return apiErr(res, 400, '网址格式不正确');
  line.slug = slug;
  line.name = String(line.name || '').trim();
  if (!line.name) return apiErr(res, 400, '请填写套餐名称');
  try {
    const html = render.renderPlanLinePage(line);
    apiOk(res, { html: html });
  } catch (e) {
    apiErr(res, 500, '渲染失败：' + e.message);
  }
});

/* 导航菜单
 * 导航项只存英文 slug（如 team），前台渲染时统一拼为 #team；
 * slug 同时用作图片上传分类与 uploads 目录名，修改后自动重命名目录并替换页面引用。
 * 首页为系统固定项（slug=top），置顶且不可删改。 */
app.post('/admin/api/nav', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const list = Array.isArray(req.body.nav) ? req.body.nav : [];
  const oldNav = store.load().nav;
  const clean = [];
  const seen = {};
  let invalid = null;
  list.forEach(function (n, i) {
    const label = String(n.label || '').trim().slice(0, 50);
    let slug = String(n.slug || n.href || '').trim().replace(/^#+/, '').replace(/^\/+/, '').toLowerCase().slice(0, 50);
    if (!label) return;
    if (!SLUG_RE.test(slug)) {
      if (!invalid) invalid = slug || '（空）';
      return;
    }
    if (seen[slug]) return;
    seen[slug] = true;
    clean.push({ id: String(n.id || 'nav_' + i), label: label, slug: slug });
  });
  if (invalid) {
    return apiErr(res, 400, '链接标识「' + invalid + '」不合法：只能用小写字母、数字和短横线（如 team），不能有中文、空格或 #');
  }
  const nav = [{ id: 'nav_home', label: '首页', slug: 'top', fixed: true }].concat(clean).slice(0, 20);

  /* slug 变更联动：重命名 uploads/<旧slug>/ 目录 + 全局替换页面里的旧路径引用 */
  oldNav.forEach(function (old) {
    const same = nav.find(function (n2) { return n2.id === old.id; });
    const oldSlug = old.slug || String(old.href || '').replace(/^#+/, '').replace(/^\/+/, '').toLowerCase();
    const newSlug = same && same.slug;
    if (!oldSlug || !newSlug || oldSlug === newSlug) return;
    const oldDir = path.join(ROOT, 'public', 'uploads', oldSlug);
    const newDir = path.join(ROOT, 'public', 'uploads', newSlug);
    if (fs.existsSync(oldDir)) {
      fs.renameSync(oldDir, newDir);
      console.log('[nav] 上传目录重命名: uploads/' + oldSlug + ' -> uploads/' + newSlug);
    }
    store.mutate(function (d) {
      d.pages.forEach(function (p) {
        p.body_html = String(p.body_html || '').split('/uploads/' + oldSlug + '/').join('/uploads/' + newSlug + '/');
      });
    });
    /* 同步替换 seed 源模板，保证未来重建数据时引用一致 */
    const idxFile = path.join(ROOT, 'index.html');
    try {
      if (fs.existsSync(idxFile)) {
        const t = fs.readFileSync(idxFile, 'utf8');
        fs.writeFileSync(idxFile, t.split('/uploads/' + oldSlug + '/').join('/uploads/' + newSlug + '/'), 'utf8');
      }
    } catch (e) { console.warn('[nav] index.html 引用替换失败：', e.message); }
  });

  store.mutate(function (d) { d.nav = nav; });
  afterChange();
  apiOk(res, { nav: nav });
});

/* 修改密码 */
app.post('/admin/api/password', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  const oldPass = String(req.body.old || '');
  const newPass = String(req.body.new || '');
  if (newPass.length < 6) return apiErr(res, 400, '新密码至少 6 位');
  const d = store.load();
  if (!bcrypt.compareSync(oldPass, d.admin.hash)) return apiErr(res, 400, '原密码不正确');
  d.admin.hash = bcrypt.hashSync(newPass, 10);
  store.save();
  apiOk(res);
});

/* 图片上传
 * 目录规则：uploads/<导航slug>/<YYYY-MM>/<时间戳-随机hex>.webp
 * 全站图片统一 webp 落盘：无论上传 jpg/png/webp/gif，一律由 sharp 转 webp 后落盘，不保留原格式。
 * 分类来自导航 slug（默认首页 top），未识别一律进 general
 * 用内存缓冲接收，handler 内按最终 category 落盘（避免 multipart 字段顺序问题） */
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads');

/** 当前月份 YYYY-MM（本地时区） */
function monthNow() {
  const t = new Date();
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0');
}

/** 解析上传分类：仅允许合法 slug，否则回落 general */
function safeCategory(v) {
  const s = String(v || '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,49}$/.test(s) ? s : 'general';
}

/** 校验图片魔数（jpeg/png/webp/gif/svg 文件头），防止伪装文件 */
function sniffImage(buf) {
  if (!buf || buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return true;
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return true;
  const head = buf.toString('utf8', 0, Math.min(256, buf.length)).trimStart().slice(0, 128).toLowerCase();
  if (head.startsWith('<?xml') || head.startsWith('<svg')) return true;
  return false;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!/\.(jpe?g|png|webp|gif|svg)$/i.test(file.originalname)) {
      return cb(new Error('仅支持 jpg / png / webp / gif / svg 图片'));
    }
    cb(null, true);
  }
});
app.post('/admin/api/upload', auth.requireAdmin, auth.requireCsrf, function (req, res) {
  upload.single('file')(req, res, function (err) {
    if (err) return apiErr(res, 400, err.message || '上传失败');
    if (!req.file) return apiErr(res, 400, '未收到文件');
    const cat = safeCategory(req.body && req.body.category);
    if (!sniffImage(req.file.buffer)) return apiErr(res, 400, '文件内容不是有效图片');
    const ym = monthNow();
    /* SVG 为矢量格式，直接落盘保留原名与矢量特性（LOGO/Favicon 常用）；其余格式统一转 webp */
    const isSvg = /\.svg$/i.test(req.file.originalname);
    const name = Date.now() + '-' + crypto.randomBytes(4).toString('hex') + (isSvg ? '.svg' : '.webp');
    const dir = path.join(UPLOADS_DIR, cat, ym);
    if (isSvg) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, name), req.file.buffer);
      const url = '/uploads/' + cat + '/' + ym + '/' + name;
      return apiOk(res, {
        url: url,
        category: cat,
        data: [{ src: url, name: cat + ' / ' + name }]
      });
    }
    sharp(req.file.buffer, { limitInputPixels: 60 * 1000 * 1000 })
      .rotate()
      .webp({ quality: 82 })
      .toBuffer()
      .then(function (webpBuf) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, name), webpBuf);
        const url = '/uploads/' + cat + '/' + ym + '/' + name;
        apiOk(res, {
          url: url,
          category: cat,
          /* GrapesJS 原生素材面板：响应带 data 字段即自动加入素材库 */
          data: [{ src: url, name: cat + ' / ' + name }]
        });
      })
      .catch(function (e) {
        apiErr(res, 400, '图片转换失败：' + (e.message || '未知错误'));
      });
  });
});

/** 递归列出 uploads 下全部图片（按分类分组、组内时间倒序） */
function listUploads() {
  const navOrder = (store.load().nav || [])
    .map(function (n) { return n.slug; })
    .filter(function (s) { return /^[a-z0-9][a-z0-9-]{0,49}$/.test(s); });
  const groups = {};
  function walk(dir, rel) {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    entries.forEach(function (en) {
      const full = path.join(dir, en.name);
      const r = rel ? rel + '/' + en.name : en.name;
      if (en.isDirectory()) walk(full, r);
      else if (/\.(jpe?g|png|webp|gif|svg)$/i.test(en.name)) {
        const st = fs.statSync(full);
        const seg = r.split('/');
        const cat = seg.length >= 3 ? seg[0] : 'general';
        const url = '/uploads/' + r.split(path.sep).join('/');
        (groups[cat] = groups[cat] || []).push({ url: url, name: en.name, time: st.mtimeMs });
      }
    });
  }
  walk(UPLOADS_DIR, '');
  const order = {};
  navOrder.forEach(function (s, i) { order[s] = i; });
  if (!(order.general >= 0)) order.general = 999;
  const groupList = Object.keys(groups)
    .sort(function (a, b) { return (order[a] != null ? order[a] : 500) - (order[b] != null ? order[b] : 500) || a.localeCompare(b); })
    .map(function (slug) {
      const items = groups[slug].sort(function (a, b) { return b.time - a.time; });
      const label = (store.load().nav || []).find(function (n) { return n.slug === slug; });
      return { slug: slug, label: (label && label.label) || slug, items: items };
    });
  const assets = groupList.reduce(function (acc, g) { return acc.concat(g.items.map(function (i) { return i.url; })); }, []);
  return { groups: groupList, assets: assets };
}

/* 已上传图片列表（编辑器素材库，按分类分组、时间倒序） */
app.get('/admin/api/uploads', auth.requireAdmin, function (req, res) {
  const r = listUploads();
  apiOk(res, { assets: r.assets, groups: r.groups });
});

/* 微信 JS 接口安全域名校验文件（MP_verify_*.txt）
 * 文件放 dist 卷根目录（挂载卷，不随镜像重建丢失），供微信后台校验域名归属；
 * 只放行固定前缀文件，path.basename 防止目录穿越 */
app.get(/^\/MP_verify_[A-Za-z0-9_-]{4,64}\.txt$/, function (req, res) {
  const name = path.basename(req.path);
  const f = path.join(ROOT, 'dist', name);
  if (!fs.existsSync(f)) return res.status(404).send('not found');
  res.type('text/plain').send(fs.readFileSync(f, 'utf8'));
});

/* ---------- 前台 ---------- */
app.get('/', function (req, res) {
  const d = store.load();
  const home = d.pages.find(function (p) { return p.is_home; });
  if (!home) return res.status(500).send('首页数据缺失，请检查 data/site.json');
  res.send(render.renderPageCached(home));
});

app.get('/:slug', function (req, res) {
  if (req.params.slug === 'admin' || req.params.slug.startsWith('admin.')) return next404(req, res);
  const d = store.load();
  const page = d.pages.find(function (p) { return p.slug === req.params.slug; });
  if (page && page.published) return res.send(render.renderPageCached(page));
  /* 套餐二级页：slug 命中 settings.planLines 时由数据驱动渲染 */
  const s = d.settings || {};
  const pl = (s.planLines && typeof s.planLines === 'object') ? s.planLines : {};
  const line = pl[req.params.slug];
  if (line && line.enabled !== false) return res.send(render.renderPlanLineCached(line));
  next404(req, res);
});

function next404(req, res) {
  res.status(404).send(render.render404());
}

app.use(function (req, res) {
  next404(req, res);
});

/* 统一错误处理（上传等） */
app.use(function (err, req, res, next) {
  console.error('[server] 错误:', err.message);
  if (req.path.startsWith('/admin/api/')) {
    return res.status(400).json({ ok: false, error: err.message || '请求处理失败' });
  }
  res.status(500).send('服务器开小差了，请稍后重试');
});

app.listen(PORT, function () {
  console.log('==================================================');
  console.log('福鲜家 CMS 已启动');
  console.log('前台地址:  http://localhost:' + PORT + '/');
  console.log('后台地址:  http://localhost:' + PORT + '/admin');
  console.log('==================================================');
});
