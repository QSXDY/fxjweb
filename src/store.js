/* ============================================================
 * 福鲜家 CMS · 数据存储层
 * 单文件 JSON 存储（data/site.json），原子写入，备份即拷文件
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'site.json');
const INITIAL_FILE = path.join(ROOT, 'initial-site.json');

let cache = null;
let rev = 0;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 加载数据：
 *  - 数据文件不存在时，若项目根有 initial-site.json（正式数据快照，Docker 首启用），
 *    直接拷贝为 site.json（保留正式账号与已改内容）；
 *  - 否则触发首次种子初始化（从 index.html 提取 + 随机密码）。
 */
function load() {
  if (cache) return cache;
  ensureDir();
  if (!fs.existsSync(DATA_FILE)) {
    if (fs.existsSync(INITIAL_FILE)) {
      fs.copyFileSync(INITIAL_FILE, DATA_FILE);
      console.log('[store] 数据文件不存在，已从 initial-site.json 初始化（保留正式账号与内容）');
    } else {
      require('./seed').seed();
    }
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  cache = JSON.parse(raw);
  return cache;
}

/** 原子保存：先写临时文件再重命名，避免写一半损坏；保存后版本号递增（缓存/静态化失效依据） */
function save() {
  ensureDir();
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
  rev++;
}

/** 数据版本号：每次落盘 +1，页面渲染缓存与 dist 生成据此判断是否需要重建 */
function version() {
  return rev;
}

/** 修改数据的统一入口：fn(数据) -> 任意返回值；修改后自动落盘 */
function mutate(fn) {
  const d = load();
  const result = fn(d);
  save();
  return result;
}

/** 生成短 id */
function newId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function now() {
  return new Date().toISOString();
}

module.exports = { load, save, mutate, newId, now, version, DATA_FILE };
