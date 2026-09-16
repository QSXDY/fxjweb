/* ============================================================
 * 福鲜家 CMS · 后台通用脚本
 * API 封装（自动携带 CSRF）、Toast、弹窗、导航高亮、退出登录
 * ============================================================ */
(function () {
  "use strict";

  var csrfMeta = document.querySelector('meta[name="csrf"]');
  var CSRF = csrfMeta ? csrfMeta.getAttribute("content") : "";

  /** 统一请求封装 */
  function api(path, opts) {
    opts = opts || {};
    var method = (opts.method || "GET").toUpperCase();
    var init = { method: method, headers: {} };
    if (method !== "GET") {
      init.headers["X-CSRF-Token"] = CSRF;
    }
    if (opts.body !== undefined && opts.body !== null) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    return fetch(path, init).then(function (res) {
      if (res.status === 401) {
        window.location.href = "/admin/login";
        throw new Error("未登录");
      }
      return res.json().then(function (data) {
        if (!data.ok) throw new Error(data.error || "操作失败");
        return data;
      });
    });
  }

  function apiGet(path) { return api(path); }

  function apiPost(path, body) { return api(path, { method: "POST", body: body }); }

  /** Toast 提示 */
  var toastEl = null;
  var toastTimer = null;
  function ensureToast() {
    if (toastEl) return;
    toastEl = document.createElement("div");
    toastEl.className = "toast-msg";
    document.body.appendChild(toastEl);
  }
  function toast(msg, type) {
    ensureToast();
    toastEl.textContent = msg;
    toastEl.className = "toast-msg is-show" + (type ? " " + type : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.className = "toast-msg";
    }, 2400);
  }
  function toastOk(msg) { toast(msg, "ok"); }
  function toastErr(msg) { toast(msg || "操作失败，请重试", "err"); }

  /** 弹窗 */
  function openModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.add("is-open");
  }
  function closeModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.remove("is-open");
  }

  /** 设置导航高亮 */
  function setActiveNav(key) {
    document.querySelectorAll(".side-nav a[data-nav]").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-nav") === key);
    });
  }

  /** 退出登录 */
  function bindLogout() {
    var btn = document.getElementById("logoutBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      apiPost("/admin/logout").then(function () {
        window.location.href = "/admin/login";
      }).catch(toastErr);
    });
  }

  /** 模板渲染工具：{{key}} 替换 */
  function renderTemplate(tpl, data) {
    return tpl.replace(/\{\{(\w+)\}\}/g, function (_, k) {
      return data[k] === undefined || data[k] === null ? "" : String(data[k]);
    });
  }

  /** 转义 HTML（后台渲染用户数据时使用） */
  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  window.Admin = {
    api: api,
    get: apiGet,
    post: apiPost,
    toast: toast,
    toastOk: toastOk,
    toastErr: toastErr,
    openModal: openModal,
    closeModal: closeModal,
    setActiveNav: setActiveNav,
    bindLogout: bindLogout,
    renderTemplate: renderTemplate,
    escHtml: escHtml
  };

  document.addEventListener("DOMContentLoaded", bindLogout);
})();
