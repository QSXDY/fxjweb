/* ============================================================
 * 导入套餐方案数据：scripts/plans_data.js -> data/site.json + initial-site.json
 * 运行：node scripts/import_plans.js
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'site.json');
const INITIAL_FILE = path.join(ROOT, 'initial-site.json');

const planData = require('./plans_data');

/* 构造 settings.planLines：以 slug 为键 */
function buildPlanLines() {
  const out = {};
  planData.lines.forEach(function (line) {
    out[line.slug] = line;
  });
  return out;
}

/* 新导航：首页 + 套餐方案（下拉由渲染层自动从 planLines 生成）+ 专家团队 + 服务保障 + 联系我们 */
function buildNav() {
  return [
    { id: 'nav_home', label: '首页', slug: 'top', fixed: true },
    { id: 'nav_plans', label: '套餐方案', slug: 'plans' },
    { id: 'nav_team', label: '专家团队', slug: 'team' },
    { id: 'nav_services', label: '服务保障', slug: 'services' },
    { id: 'nav_contact', label: '联系我们', slug: 'contact' }
  ];
}

function applyTo(d) {
  if (!d.settings) d.settings = {};
  d.settings.planLines = buildPlanLines();
  d.nav = buildNav();
  return d;
}

/* 写入 data/site.json（保留其他全部字段） */
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
applyTo(data);
fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
console.log('[import] site.json 已写入 planLines（' + Object.keys(data.settings.planLines).length + ' 条餐线）');

/* 同步 initial-site.json（若存在） */
if (fs.existsSync(INITIAL_FILE)) {
  const ini = JSON.parse(fs.readFileSync(INITIAL_FILE, 'utf8'));
  applyTo(ini);
  fs.writeFileSync(INITIAL_FILE, JSON.stringify(ini, null, 2), 'utf8');
  console.log('[import] initial-site.json 已同步');
}

console.log('[import] 完成');
