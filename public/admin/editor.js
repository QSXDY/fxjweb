/* ============================================================
 * 福鲜家 CMS · 可视化编辑器（GrapesJS）
 * 拖拽改页面：自定义区块 + 数据组件（每日菜单/客户评价）
 * ============================================================ */
/* global grapesjs */
(function () {
  "use strict";

  var PAGE = window.__PAGE__ || {};
  var CSRF = (document.querySelector('meta[name="csrf"]') || {}).getAttribute
    ? document.querySelector('meta[name="csrf"]').getAttribute("content")
    : "";

  function toast(msg, type) {
    var el = document.getElementById("editorToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "editorToast";
      el.style.cssText =
        "position:fixed;left:50%;bottom:36px;transform:translateX(-50%);background:#333;color:#fff;" +
        "padding:10px 20px;border-radius:999px;font-size:14px;z-index:9999;opacity:0;transition:opacity .2s ease;max-width:80vw;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.background = type === "ok" ? "#42B883" : type === "err" ? "#D9534F" : "#333";
    el.style.opacity = "1";
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.opacity = "0"; }, 2400);
  }

  /* ---------- 自定义区块 ---------- */
  var BLOCKS = [
    {
      id: "fxj-heading",
      label: "标题 + 正文",
      category: "基础区块",
      content:
        '<div style="max-width:960px;margin:0 auto;padding:24px 20px;">' +
        '<h2 style="margin:0 0 12px;color:#333333;">标题文字</h2>' +
        '<p style="margin:0;line-height:1.8;color:#777777;">在这里输入正文内容，选中文字后可在右侧调整颜色与字号。</p>' +
        "</div>"
    },
    {
      id: "fxj-paragraph",
      label: "正文段落",
      category: "基础区块",
      content:
        '<p style="max-width:960px;margin:16px auto;line-height:1.8;color:#777777;">在这里输入正文内容…</p>'
    },
    {
      id: "fxj-image",
      label: "图片",
      category: "基础区块",
      content:
        '<img src="/uploads/placeholder.svg" alt="图片" style="max-width:100%;display:block;margin:16px auto;">'
    },
    {
      id: "fxj-columns",
      label: "两栏布局",
      category: "基础区块",
      content:
        '<div style="display:flex;gap:20px;flex-wrap:wrap;max-width:960px;margin:0 auto;padding:16px 20px;">' +
        '<div style="flex:1;min-width:220px;">左栏内容</div>' +
        '<div style="flex:1;min-width:220px;">右栏内容</div>' +
        "</div>"
    },
    {
      id: "fxj-button",
      label: "按钮",
      category: "基础区块",
      content:
        '<div style="text-align:center;padding:20px;">' +
        '<a class="btn btn-deep" href="tel:19989901658" style="display:inline-block;">立即咨询</a>' +
        "</div>"
    },
    {
      id: "fxj-divider",
      label: "分隔线",
      category: "基础区块",
      content: '<hr style="border:none;border-top:1px solid #E3E9E9;margin:24px auto;max-width:960px;">'
    },
    {
      id: "fxj-menu",
      label: "每日菜单列表",
      category: "数据组件",
      content:
        '<div class="fxj-widget" data-widget="menu-list">每日菜单列表 · 数据在后台「条目管理」维护，此处自动展示</div>'
    },
    {
      id: "fxj-reviews",
      label: "客户评价列表",
      category: "数据组件",
      content:
        '<div class="fxj-widget" data-widget="reviews-list">客户评价列表 · 数据在后台「条目管理」维护，此处自动展示</div>'
    }
  ];

  var editor = null;

  /* ---------- 分类选择弹窗（双击图片上传 / 工具栏上传共用） ---------- */
  function fillCategorySelect(sel, done) {
    fetch("/admin/api/settings", { headers: { "X-CSRF-Token": CSRF } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!(d.ok && d.nav)) { if (done) done(); return; }
        var opts = d.nav.map(function (n) { return { slug: n.slug, label: n.label }; });
        if (!opts.some(function (o) { return o.slug === "general"; })) {
          opts.push({ slug: "general", label: "其他（general）" });
        }
        sel.innerHTML = opts.map(function (o) {
          return '<option value="' + o.slug + '">' + o.label + "（" + o.slug + "）</option>";
        }).join("");
        if (done) done();
      })
      .catch(function () { if (done) done(); });
  }

  /* ---------- 原生上传器改造：在 GrapesJS 素材面板上传区注入分类下拉 ---------- */
  function injectAmCategory() {
    var box = document.querySelector(".gjs-am-file-uploader") || document.querySelector(".gjs-am-assets");
    if (!box || document.getElementById("fxjAmCategory")) return;
    var wrap = document.createElement("div");
    wrap.style.cssText =
      "display:flex;align-items:center;gap:8px;padding:9px 10px;background:#F6F8F8;border:1px solid #E3E9E9;border-radius:6px;margin-bottom:10px;";
    wrap.innerHTML =
      '<label style="font-size:13px;color:#333333;white-space:nowrap;">图片分类：</label>' +
      '<select id="fxjAmCategory" style="flex:1;min-width:0;padding:5px 8px;border:1px solid #d9dee3;border-radius:6px;font-size:13px;background:#fff;"></select>' +
      '<span style="font-size:12px;color:#777777;white-space:nowrap;">存入 uploads/分类/月份/</span>';
    box.parentNode.insertBefore(wrap, box);
    fillCategorySelect(wrap.querySelector("#fxjAmCategory"));
  }

  function initEditor() {
    var host = document.getElementById("gjs");
    if (host) host.innerHTML = "";
    var cfg = {
      container: "#gjs",
      fromElement: false,
      height: "100%",
      storageManager: false,
      /* GrapesJS v0.23.6 中文界面（i18n 会规范化为 zh） */
      i18n: {
        locale: "zh",
        detectLocale: false,
        messages: { zh: window.GRAPES_ZH || {}, "zh-CN": window.GRAPES_ZH || {} }
      },
      textViewCode: "查看代码",
      assetManager: {
        /* 原生上传器：URL 上传（GrapesJS 0.23.6 的函数式 upload 会走 fetch(函数) 失败，勿改）
           customFetch 拦截请求，读取上传区「图片分类」下拉，动态附加 category 字段 */
        upload: "/admin/api/upload",
        uploadName: "file",
        /* 关键：GrapesJS 默认把文件字段命名为 file[]（multiUploadSuffix 默认 []），
           multer single('file') 只认 file，必须清空后缀 */
        multiUploadSuffix: "",
        headers: { "X-CSRF-Token": CSRF },
        customFetch: function (url, opts) {
          var body = opts && opts.body;
          var catSel = document.getElementById("fxjAmCategory");
          var cat = catSel && catSel.value ? catSel.value : "top";
          if (body && typeof body.append === "function") {
            body.append("category", cat);
          }
          return fetch(url, opts);
        },
        assets: []
      },
      canvas: {
        /* 注入全站 CSS + MiSans 字体（与原站 index.html 头部一致，浏览器按需下载字重） */
        styles: [
          "/css/style.css",
          "/css/widget.css",
          "https://cdn.xrbk.cn/fonts/MiSans-Thin/result.css",
          "https://cdn.xrbk.cn/fonts/MiSans-ExtraLight/result.css",
          "https://cdn.xrbk.cn/fonts/MiSans-Light/result.css",
          "https://cdn.xrbk.cn/fonts/MiSans-Normal/result.css",
          "https://cdn.xrbk.cn/fonts/MiSans-Regular/result.css",
          "https://cdn.xrbk.cn/fonts/MiSans-Medium/result.css",
          "https://cdn.xrbk.cn/fonts/MiSans-Semibold/result.css",
          "https://cdn.xrbk.cn/fonts/MiSans-Demibold/result.css",
          "https://cdn.xrbk.cn/fonts/MiSans-Bold/result.css",
          "https://cdn.xrbk.cn/fonts/MiSans-Heavy/result.css"
        ],
        scripts: ["/admin/assets/canvas-symbols.js", "/admin/assets/canvas-fix.js"]
      },
      blockManager: {
        blocks: BLOCKS.map(function (b) {
          return {
            id: b.id,
            label: b.label,
            category: b.category,
            content: b.content
          };
        })
      }
    };
    editor = grapesjs.init(cfg);
    /* 暴露编辑器实例（调试/自动化验证用） */
    try { window.__editor = editor; } catch (e) { /* ignore */ }

    /* 中文语言包兜底（配置方式失效时再次应用） */
    try {
      if (window.GRAPES_ZH && editor.I18n) {
        editor.I18n.addMessages("zh", window.GRAPES_ZH);
        editor.I18n.addMessages("zh-CN", window.GRAPES_ZH);
        editor.I18n.setLocale("zh");
      }
    } catch (e) { console.error("[editor] i18n 应用失败：", e); }

    /* 加载已上传图片到素材库（后端已按「分类组 + 组内时间倒序」排列；
     * GrapesJS 0.23.6 素材面板无分组 UI，素材名标注分类便于识别） */
    fetch("/admin/api/uploads", { headers: { "X-CSRF-Token": CSRF } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!(d.ok && d.assets && d.assets.length) || !editor || !editor.AssetManager) return;
        var AM = editor.AssetManager;
        d.assets.forEach(function (url) {
          var seg = url.split("/");
          var cat = seg.length >= 4 ? seg[2] : "general";
          AM.add({ src: url, name: cat + " / " + seg[seg.length - 1] });
        });
      })
      .catch(function () { /* 素材库加载失败不影响编辑 */ });

    /* 载入页面内容 */
    if (PAGE.body_html) {
      try { editor.setComponents(PAGE.body_html); } catch (e) { console.error(e); }
    }
    if (PAGE.css) {
      try { editor.setStyle(PAGE.css); } catch (e) { console.error(e); }
    }

    /* 设备切换：隐藏 GrapesJS 默认设备面板（左上角挤压来源），改用顶部工具栏下拉框 */
    try {
      var dPanel = editor.Panels.getPanel("devices-c");
      if (dPanel) dPanel.set("visible", false);
    } catch (e) { console.error("[editor] 隐藏默认设备面板失败：", e); }

    /* 字体下拉：默认小米字体（MiSans），替换 GrapesJS 内建英文字体表 */
    try {
      var fmProp = editor.StyleManager.getProperty("typography", "font-family");
      if (fmProp) {
        var optsFonts = [
          { id: "MiSans, PingFang SC, Microsoft YaHei, sans-serif", label: "MiSans（网站默认）" },
          { id: "MiSans Medium, MiSans, PingFang SC, Microsoft YaHei, sans-serif", label: "MiSans Medium" },
          { id: "MiSans Demibold, MiSans Semibold, MiSans, PingFang SC, Microsoft YaHei, sans-serif", label: "MiSans Demibold" },
          { id: "PingFang SC, Microsoft YaHei, sans-serif", label: "苹方 / 微软雅黑" },
          { id: "Georgia, serif", label: "Georgia" },
          { id: "Times New Roman, Times, serif", label: "Times New Roman" },
          { id: "Verdana, Geneva, sans-serif", label: "Verdana" },
          { id: "Arial, Helvetica, sans-serif", label: "Arial" }
        ];
        fmProp.set("options", optsFonts);
        fmProp.set("default", optsFonts[0].id);
      }
    } catch (e) { console.error("[editor] 设置默认字体失败：", e); }

    /* 素材面板打开时，在原生上传区注入「图片分类」下拉 */
    try {
      editor.on("assetManager:open", injectAmCategory);
      /* 兜底：无论事件名是否触发，监听 DOM 变化保证注入 */
      new MutationObserver(function () {
        if (!document.getElementById("fxjAmCategory")) injectAmCategory();
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) { console.error("[editor] 绑定素材面板事件失败：", e); }

    var deviceSel = document.getElementById("deviceSelect");
    if (deviceSel) {
      var devices = editor.Devices.getAll();
      devices.forEach(function (d) {
        var id = d.get("id") || "";
        var label = id;
        try { label = editor.I18n.t("deviceManager.devices." + id) || d.get("name") || id; }
        catch (e) { label = d.get("name") || id; }
        var opt = document.createElement("option");
        opt.value = id;
        opt.textContent = label;
        deviceSel.appendChild(opt);
      });
      deviceSel.value = editor.getDevice();
      deviceSel.addEventListener("change", function () { editor.setDevice(deviceSel.value); });
      editor.on("change:device", function () { deviceSel.value = editor.getDevice(); });
    }
  }

  try {
    initEditor();
  } catch (e) {
    console.error("[editor] 初始化失败：", e);
    document.getElementById("gjs").innerHTML =
      '<div style="padding:80px 20px;text-align:center;color:#D9534F;">编辑器初始化失败：' + e.message + "</div>";
    return;
  }

  /* ---------- 顶部工具按钮 ---------- */
  var titleInput = document.getElementById("pageTitle");
  var pubCheck = document.getElementById("pagePublished");
  var previewBtn = document.getElementById("pagePreview");
  var saveBtn = document.getElementById("pageSave");

  if (titleInput) titleInput.value = PAGE.title || "";
  if (pubCheck) pubCheck.checked = PAGE.published !== false;
  if (previewBtn) previewBtn.href = "/" + (PAGE.slug || "");

  function doSave() {
    var title = (titleInput ? titleInput.value : "").trim();
    if (!title) { toast("请填写页面标题", "err"); return; }
    saveBtn.disabled = true;
    saveBtn.textContent = "保存中…";
    fetch("/admin/api/pages/" + PAGE.id + "/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": CSRF },
      body: JSON.stringify({
        title: title,
        meta: PAGE.meta || "",
        body_html: editor.getHtml(),
        css: editor.getCss(),
        published: pubCheck ? pubCheck.checked : true
      })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.ok) throw new Error(d.error || "保存失败");
      toast("已保存，前台刷新即可看到", "ok");
    }).catch(function (e) {
      toast(e.message || "保存失败", "err");
    }).finally(function () {
      saveBtn.disabled = false;
      saveBtn.textContent = "保存";
    });
  }

  if (saveBtn) saveBtn.addEventListener("click", doSave);
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      doSave();
    }
  });

  /* ---------- 上传图片（带分类选择，对应 uploads/<分类>/<月份>/ 目录） ---------- */
  var uploadModalBuilt = false;
  function buildUploadModal() {
    if (uploadModalBuilt) return;
    uploadModalBuilt = true;
    var mask = document.createElement("div");
    mask.className = "modal-mask";
    mask.id = "uploadModal";
    mask.innerHTML =
      '<div class="modal-box">' +
      "<h3>上传图片</h3>" +
      '<p style="margin:0 0 12px;font-size:13px;color:#777777;">分类对应导航栏目，决定图片存放文件夹（uploads/分类/月份/）。上传后可在素材库中找到。</p>' +
      '<div class="field"><label for="uploadCategory">图片分类</label>' +
      '<select class="select" id="uploadCategory" style="width:100%;"></select></div>' +
      '<div class="field" style="margin-top:12px;"><label for="uploadFile">选择图片（jpg / png / webp / gif，≤10MB）</label>' +
      '<input class="input" type="file" id="uploadFile" accept="image/jpeg,image/png,image/webp,image/gif" style="padding:8px;"></div>' +
      '<div class="modal-foot">' +
      '<button class="btn" id="uploadCancel">取消</button>' +
      '<button class="btn btn-gold" id="uploadSubmit">开始上传</button>' +
      "</div></div>";
    document.body.appendChild(mask);
    mask.addEventListener("click", function (e) { if (e.target === mask) closeUploadModal(); });
    document.getElementById("uploadCancel").addEventListener("click", closeUploadModal);
    document.getElementById("uploadSubmit").addEventListener("click", doUpload);
  }
  function closeUploadModal() {
    var m = document.getElementById("uploadModal");
    if (m) m.classList.remove("is-open");
  }
  function openUploadModal() {
    buildUploadModal();
    var sel = document.getElementById("uploadCategory");
    fetch("/admin/api/settings", { headers: { "X-CSRF-Token": CSRF } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!(d.ok && d.nav)) return;
        var opts = d.nav.map(function (n) { return { slug: n.slug, label: n.label }; });
        if (!opts.some(function (o) { return o.slug === "general"; })) {
          opts.push({ slug: "general", label: "其他（general）" });
        }
        sel.innerHTML = opts.map(function (o) {
          return '<option value="' + o.slug + '">' + o.label + "（" + o.slug + "）</option>";
        }).join("");
      })
      .catch(function () { /* 分类加载失败时提交默认 */ });
    document.getElementById("uploadFile").value = "";
    document.getElementById("uploadModal").classList.add("is-open");
  }
  function reloadAssets() {
    fetch("/admin/api/uploads", { headers: { "X-CSRF-Token": CSRF } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!(d.ok && editor && editor.AssetManager)) return;
        var AM = editor.AssetManager;
        try { if (AM.clear) AM.clear(); } catch (e) { /* ignore */ }
        d.assets.forEach(function (url) {
          var seg = url.split("/");
          var cat = seg.length >= 4 ? seg[2] : "general";
          AM.add({ src: url, name: cat + " / " + seg[seg.length - 1] });
        });
      })
      .catch(function () { /* 刷新失败不影响 */ });
  }
  function doUpload() {
    var fileInput = document.getElementById("uploadFile");
    var catSel = document.getElementById("uploadCategory");
    var cat = catSel && catSel.value ? catSel.value : "top";
    if (!fileInput.files || !fileInput.files.length) {
      toast("请先选择图片文件", "err");
      return;
    }
    var fd = new FormData();
    fd.append("category", cat);
    fd.append("file", fileInput.files[0]);
    var btn = document.getElementById("uploadSubmit");
    btn.disabled = true;
    btn.textContent = "上传中…";
    fetch("/admin/api/upload", { method: "POST", headers: { "X-CSRF-Token": CSRF }, body: fd })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.ok) throw new Error(d.error || "上传失败");
        toast("已上传到「" + cat + "」分类", "ok");
        closeUploadModal();
        reloadAssets();
      })
      .catch(function (e) { toast(e.message || "上传失败", "err"); })
      .finally(function () { btn.disabled = false; btn.textContent = "开始上传"; });
  }
  var uploadBtn = document.getElementById("pageUpload");
  if (uploadBtn) uploadBtn.addEventListener("click", openUploadModal);

  /* 撤销 / 重做 / 代码 工具按钮（GrapesJS v0.23.6 命令名） */
  function addToolButton(label, cmd) {
    var b = document.createElement("button");
    b.className = "btn btn-sm";
    b.textContent = label;
    b.addEventListener("click", function () { editor.runCommand(cmd); });
    saveBtn.parentNode.insertBefore(b, saveBtn);
  }
  if (saveBtn) {
    addToolButton("撤销", "core:undo");
    addToolButton("重做", "core:redo");
    addToolButton("代码", "core:open-code");
  }
})();
