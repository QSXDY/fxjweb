/* 编辑器画布修正：让滚动显现等动画元素在编辑时可见可编辑 */
(function () {
  function fix() {
    if (!document.body) return;
    var s = document.createElement("style");
    s.textContent = "body .reveal{opacity:1;transform:none;}";
    document.head.appendChild(s);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fix);
  } else {
    fix();
  }
})();
