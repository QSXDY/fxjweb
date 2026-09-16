/* ============================================================
 * 福鲜家 CMS · 首次初始化（种子）
 * 从现有 index.html / js/script.js 提取：
 *   - 首页正文（main 内容）作为首页页面
 *   - SVG 图标库、导航、站点配置、价格数据、套餐详情
 * 生成 data/site.json 与默认管理员账号
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const ROOT = path.join(__dirname, '..');
const INDEX_FILE = path.join(ROOT, 'index.html');
const SCRIPT_FILE = path.join(ROOT, 'js', 'script.js');
const DATA_FILE = path.join(ROOT, 'data', 'site.json');
const DATA_DIR = path.join(ROOT, 'data');
const CANVAS_SYMBOLS_FILE = path.join(ROOT, 'public', 'admin', 'canvas-symbols.js');

/** 提取 JS 源码中的顶层对象字面量（var NAME = {...};），转为 JSON 对象 */
function extractJsObject(src, varName) {
  const start = src.indexOf('var ' + varName + ' = ');
  if (start < 0) return null;
  const brace = src.indexOf('{', start);
  if (brace < 0) return null;
  let depth = 0;
  let i = brace;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  const block = src.slice(brace, i);
  // 把对象字面量的裸键（字母键与数字键）转成 JSON 键
  const json = block
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/([{,]\s*)(\d+)\s*:/g, '$1"$2":');
  try {
    return JSON.parse(json);
  } catch (e) {
    console.warn('[seed] 解析 ' + varName + ' 失败，将使用内置默认值：' + e.message);
    return null;
  }
}

/** 从 index.html 提取各片段 */
function extractIndex(html) {
  const mMain = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  const mSvg = html.match(/<svg[^>]*>[\s\S]*?<\/svg>/);
  const mTitle = html.match(/<title>([\s\S]*?)<\/title>/);
  const mMeta = html.match(/<meta name="description" content="([^"]*)"/);
  const mNav = html.match(/<nav class="nav-links"[\s\S]*?<\/nav>/);
  const mTel = html.match(/tel:(\d{6,})/);
  const mWx = html.match(/<strong id="wxId">([^<]+)<\/strong>/);
  const nav = [];
  if (mNav) {
    const linkRe = /<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let mm;
    while ((mm = linkRe.exec(mNav[0])) !== null) {
      const label = mm[2].replace(/<[^>]+>/g, '').trim();
      if (label) nav.push({ id: 'nav_' + Date.now().toString(36) + nav.length, label: label, href: mm[1] });
    }
  }
  return {
    main: mMain ? mMain[1].trim() : '',
    svg: mSvg ? mSvg[0] : '',
    title: mTitle ? mTitle[1] : '福鲜家营养餐',
    meta: mMeta ? mMeta[1] : '',
    nav: nav,
    phone: mTel ? mTel[1] : '',
    wechat: mWx ? mWx[1] : ''
  };
}

/** 首次初始化：生成 site.json */
function seed() {
  console.log('[seed] 首次运行，正在初始化数据（从现有 index.html / script.js 导入）……');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const indexHtml = fs.readFileSync(INDEX_FILE, 'utf8');
  const scriptJs = fs.readFileSync(SCRIPT_FILE, 'utf8');

  const index = extractIndex(indexHtml);
  // 相对路径统一为绝对路径，避免在 /menu 等子路径下解析错位
  const mainHtml = index.main.replace(/(\s(?:src|href)=")(?!\/|https?:|#|data:)([^"]+)/g, '$1/$2');
  // 价格与套餐详情默认值：从 js/script.js 的 DEFAULT_PRICES / DEFAULT_DETAILS 提取
  const prices = extractJsObject(scriptJs, 'DEFAULT_PRICES');
  const details = extractJsObject(scriptJs, 'DEFAULT_DETAILS');

  // 默认管理员：随机初始密码
  const password = crypto.randomBytes(6).toString('base64url');
  const hash = bcrypt.hashSync(password, 10);

  const now = new Date().toISOString();
  const data = {
    version: 1,
    secret: crypto.randomBytes(32).toString('hex'),
    admin: { user: 'admin', hash: hash },
    settings: {
      siteName: '福鲜家营养餐',
      siteSub: '月子餐 · 定制配送',
      phone: index.phone || '19989901658',
      wechatId: index.wechat || 'ZTFXJ1689',
      wechatJumpUrl: '',
      consultUrl: '',
      bookingUrl: '',
      miniProgramUrl: '',
      pricesMeta: { tiers: ['标准调养', '定制调理', '专属私配'], durations: ['14天', '28天', '42天'] },
      address: '昭通市昭阳区省耕山水 1 号地块 8 号电梯 4 楼',
      hours: '周一至周日 9:00 – 19:00',
      footerNote: '营业时间：周一至周日 9:00 – 19:00 ｜ 页面图片为示意，餐品与价格以门店当日实际为准。',
      prices: prices,
      details: details
    },
    nav: index.nav,
    pages: [
      {
        id: 'p_home',
        title: index.title,
        slug: '',
        meta: index.meta,
        body_html: mainHtml,
        css: '',
        published: true,
        is_home: true,
        needs_home_js: true,
        created_at: now,
        updated_at: now
      }
    ],
    menus: [],
    reviews: [],
    layout: { svgSymbols: index.svg }
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

  // 供编辑器画布预览图标的 SVG 注入脚本
  const safeSvg = index.svg.replace(/<\/script>/gi, '<\\/script>');
  fs.writeFileSync(
    CANVAS_SYMBOLS_FILE,
    '(function(){var s=' + JSON.stringify(safeSvg) + ';function inject(){if(!document.body)return;var d=document.createElement("div");d.style.display="none";d.innerHTML=s;document.body.appendChild(d);}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",inject);}else{inject();}})();\n',
    'utf8'
  );

  // 初始密码提示文件（登录后请立即在「站点设置 → 修改密码」中更换）
  fs.writeFileSync(
    path.join(DATA_DIR, '初始密码.txt'),
    '福鲜家网站后台 · 初始登录信息\n====================================\n后台地址：http://服务器IP:3000/admin\n登录账号：' + data.admin.user + '\n初始密码：' + password + '\n\n（登录后请立即到「站点设置 → 修改密码」中更换密码）\n',
    'utf8'
  );

  console.log('==================================================');
  console.log('[seed] 数据初始化完成');
  console.log('[seed] 后台地址: /admin    账号: ' + data.admin.user + '    初始密码: ' + password);
  console.log('[seed] 初始密码已写入 data/初始密码.txt，登录后请立即修改');
  console.log('==================================================');
}

module.exports = { seed };
