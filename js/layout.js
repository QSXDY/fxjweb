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

  /* ---------- PC 端「联系方式」弹窗（替代 tel: 拨号） ---------- */
  var contactModal = document.getElementById("contactModal");
  if (!contactModal) {
    contactModal = document.createElement("div");
    contactModal.id = "contactModal";
    contactModal.className = "contact-modal";
    contactModal.hidden = true;
    contactModal.innerHTML =
      '<div class="contact-modal-backdrop" data-cm-close></div>' +
      '<div class="contact-modal-panel">' +
      '<button class="contact-modal-close" data-cm-close aria-label="关闭">' +
      '<svg viewBox="0 0 24 24"><use href="#ic-close" xlink:href="#ic-close"/></svg>' +
      '</button>' +
      '<p class="cm-title">联系我们</p>' +
      '<p class="cm-sub">微信扫码添加专属顾问 · 免费试吃预约</p>' +
      '<div class="cm-qr-wrap"><img class="cm-qr" src="' + (CFG.qrUrl || '/uploads/contact/2026-09/1789571940000-6d50b470.webp') + '" alt="微信二维码"></div>' +
      '<div class="cm-rows">' +
      '<div class="cm-row"><span class="cm-label">微信</span><span class="cm-val">' + (CFG.wechatId || "") + 
      '</div>' +
      '<div class="cm-row"><span class="cm-label">电话</span><span class="cm-val">' + (CFG.phone || "") + 
      '</div>' +
      '<p class="cm-note">点击复制微信号，打开微信搜索即可添加</p>' +
      '</div>';
    document.body.appendChild(contactModal);
  }

  function isTouchDevice() {
    return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  }

  function openContactModal() {
    contactModal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeContactModal() {
    contactModal.hidden = true;
    document.body.style.overflow = "";
  }

  contactModal.addEventListener("click", function (e) {
    // 点中关闭按钮（或其内部的 svg 图标）向上找到带 data-cm-close 的祖先
    var closeEl = e.target.closest("[data-cm-close]");
    if (closeEl) { closeContactModal(); return; }
    // 点中遮罩层（而非面板）也关闭
    if (e.target === contactModal.querySelector(".contact-modal-backdrop")) {
      closeContactModal();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !contactModal.hidden) closeContactModal();
  });

  var cmCopyWx = document.getElementById("cmCopyWx");
  if (cmCopyWx) {
    cmCopyWx.addEventListener("click", function () {
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
          showToast("微信号已复制：" + wx);
        }).catch(fallback);
      } else {
        fallback();
        showToast("微信号已复制：" + wx);
      }
    });
  }

  /* ---------- data-action 按钮统一跳转 ----------
     consult     -> consultUrl（空则：移动端拨号 / PC 端弹联系方式弹窗）
     booking     -> bookingUrl（空则：移动端拨号 / PC 端弹联系方式弹窗）
     miniprogram -> miniProgramUrl（空则提示） */
  document.querySelectorAll("[data-action]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      var act = el.getAttribute("data-action");
      if (act === "consult" || act === "booking") {
        e.preventDefault();
        var target = act === "consult" ? CFG.consultUrl : CFG.bookingUrl;
        if (target) {
          window.location.href = target;
        } else if (isTouchDevice()) {
          window.location.href = telHref();
        } else {
          openContactModal();
        }
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
  ["copyWx", "copyWx2", "mctaWx", "modalCopyWx", "quoteCopyWx"].forEach(function (id) {
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
