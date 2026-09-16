/* ============================================================
 * 福鲜家 CMS · 后台鉴权
 * 会话登录 + CSRF 校验 + 登录失败限流
 * ============================================================ */
'use strict';

const bcrypt = require('bcryptjs');
const store = require('./store');

const MAX_FAILS = 5;
const LOCK_MS = 10 * 60 * 1000; // 连续失败 5 次锁定 10 分钟

/** 校验管理员账号密码 */
function checkLogin(user, pass) {
  const d = store.load();
  const a = d.admin;
  if (!a || String(user) !== String(a.user)) return { ok: false, reason: '账号或密码错误' };
  if (a.lockedUntil && Date.now() < a.lockedUntil) {
    const left = Math.ceil((a.lockedUntil - Date.now()) / 60000);
    return { ok: false, reason: '失败次数过多，已锁定 ' + left + ' 分钟，请稍后再试' };
  }
  if (!bcrypt.compareSync(String(pass), a.hash)) {
    const fails = (a.fails || 0) + 1;
    const patch = { fails: fails };
    if (fails >= MAX_FAILS) patch.lockedUntil = Date.now() + LOCK_MS;
    store.mutate(function (data) {
      data.admin = Object.assign({}, data.admin, patch);
      if (patch.lockedUntil) data.admin.fails = 0;
    });
    return { ok: false, reason: fails >= MAX_FAILS ? '失败次数过多，已锁定 10 分钟' : '账号或密码错误' };
  }
  store.mutate(function (data) {
    data.admin.fails = 0;
    data.admin.lockedUntil = null;
  });
  return { ok: true };
}

/** 需要登录 */
function requireAdmin(req, res, next) {
  if (req.session && req.session.user) return next();
  if (req.path.startsWith('/admin/api/')) {
    return res.status(401).json({ ok: false, error: '未登录或会话已过期' });
  }
  return res.redirect('/admin/login');
}

/** CSRF 校验（表单/API 的写操作） */
function requireCsrf(req, res, next) {
  if (!req.session || !req.session.csrf) return res.status(403).json({ ok: false, error: '会话无效，请刷新页面重试' });
  const token = req.headers['x-csrf-token'];
  if (token !== req.session.csrf) return res.status(403).json({ ok: false, error: '安全校验失败，请刷新页面重试' });
  next();
}

module.exports = { checkLogin, requireAdmin, requireCsrf };
