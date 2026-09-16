/* ============================================================
   福鲜家 CMS · 全站通用脚本 layout.js
   所有页面加载：站点配置跳转、复制微信、导航交互、弹窗、Toast
   所有元素均做存在性判断，新页面缺少某元素也不会报错
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};

  /* ---------- 工具 ---------- */
  var toastEl = document.getElementById("toast");
  var toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-show"); }, 2600);
  }

  function telHref() {
    return "tel:" + String(CFG.phone || "").replace(/[\s\-]/g, "");
  }

  function jumpTo(url, fallback) {
    if (url) { window.location.href = url; } else if (fallback) { fallback(); }
  }

  /* 暴露给页面内其他脚本使用 */
  window.FXJ = { showToast: showToast, telHref: telHref, jumpTo: jumpTo, CFG: CFG };

  /* ---------- 电话链接自动套用配置电话 ---------- */
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.setAttribute("href", telHref());
  });

  /* ---------- data-action 按钮统一跳转 ----------
     consult     -> consultUrl（空则拨打电话）
     booking     -> bookingUrl（空则拨打电话）
     miniprogram -> miniProgramUrl（空则提示） */
  document.querySelectorAll("[data-action]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      var act = el.getAttribute("data-action");
      if (act === "consult") {
        e.preventDefault();
        jumpTo(CFG.consultUrl, function () { window.location.href = telHref(); });
      } else if (act === "booking") {
        e.preventDefault();
        jumpTo(CFG.bookingUrl, function () { window.location.href = telHref(); });
      } else if (act === "miniprogram") {
        e.preventDefault();
        jumpTo(CFG.miniProgramUrl, function () {
          showToast("小程序商城即将上线，请先电话咨询 " + CFG.phone);
        });
      }
    });
  });

  /* ---------- 复制微信号 ---------- */
  function copyWechat() {
    if (CFG.wechatJumpUrl) {
      window.location.href = CFG.wechatJumpUrl;
      return;
    }
    var wx = CFG.wechatId || "";
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = wx;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(wx).then(function () {
        showToast("微信号已复制：" + wx + "，打开微信搜索即可添加");
      }).catch(fallback);
    } else {
      fallback();
      showToast("微信号已复制：" + wx + "，打开微信搜索即可添加");
    }
  }
  ["copyWx", "copyWx2", "mctaWx", "modalCopyWx"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("click", copyWechat);
  });

  /* ---------- 导航：滚动状态 / 移动端菜单 ---------- */
  var nav = document.getElementById("siteNav");
  if (nav) {
    function onScroll() {
      nav.classList.toggle("is-scrolled", window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var burger = document.getElementById("navBurger");
  var mobileMenu = document.getElementById("mobileMenu");
  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      var open = mobileMenu.hidden;
      mobileMenu.hidden = !open;
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        mobileMenu.hidden = true;
        burger.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- 弹窗关闭 ---------- */
  var modal = document.getElementById("planModal");
  document.querySelectorAll("[data-close-modal]").forEach(function (el) {
    el.addEventListener("click", function () {
      if (modal) modal.hidden = true;
      document.body.style.overflow = "";
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.hidden) {
      modal.hidden = true;
      document.body.style.overflow = "";
    }
  });

  /* ---------- 页脚年份 ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
