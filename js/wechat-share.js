/* 微信分享 JSSDK
 * 仅微信内生效：请求后端签名 -> 加载 jweixin -> wx.config -> 设置分享卡片。
 * 任何一步失败都静默降级（微信会使用默认抓取信息），不影响页面功能。 */
(function () {
  'use strict';

  var isWechat = /MicroMessenger/i.test(navigator.userAgent);
  if (!isWechat) return;

  /* 签名 URL 必须与微信内实际访问地址完全一致（去掉 # 及之后部分） */
  var pageUrl = location.href.split('#')[0];

  /* 相对路径转绝对 URL（微信分享缩略图必须为完整地址） */
  function toAbsUrl(u) {
    if (!u) return '';
    if (/^(https?:)?\/\//i.test(u)) return u;
    if (u.charAt(0) === '/') return location.origin + u;
    var a = document.createElement('a');
    a.href = u;
    return a.href;
  }

  /* 页面级覆盖 > 后端全局配置 > 页面默认 */
  function meta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? (el.getAttribute('content') || '') : '';
  }

  fetch('/api/wechat/sign?url=' + encodeURIComponent(pageUrl))
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || !d.ok || !d.appId) return; /* 未配置：保持默认分享 */

      var script = document.createElement('script');
      script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
      var settled = false;

      function fail(msg) {
        if (window.console) console.warn('[wechat-share] ' + msg);
      }

      script.onload = function () {
        if (settled) return;
        settled = true;
        if (!window.wx) return fail('jweixin 加载失败');

        wx.config({
          debug: false,
          appId: d.appId,
          timestamp: d.timestamp,
          nonceStr: d.nonceStr,
          signature: d.signature,
          jsApiList: [
            'updateAppMessageShareData',
            'updateTimelineShareData',
            'onMenuShareAppMessage',
            'onMenuShareTimeline'
          ]
        });

        wx.error(function (err) {
          fail('config 失败：' + (err && err.errMsg ? err.errMsg : '未知错误'));
        });

        wx.ready(function () {
          var shareData = {
            title: meta('share-title') || d.title || document.title,
            desc: meta('share-desc') || d.desc || '',
            link: pageUrl,
            imgUrl: toAbsUrl(meta('share-img') || d.img || '')
          };

          /* 新接口优先；旧版微信内核回退老接口 */
          if (wx.updateAppMessageShareData) {
            wx.updateAppMessageShareData(shareData);
          } else if (wx.onMenuShareAppMessage) {
            wx.onMenuShareAppMessage(shareData);
          }
          if (wx.updateTimelineShareData) {
            wx.updateTimelineShareData(shareData);
          } else if (wx.onMenuShareTimeline) {
            wx.onMenuShareTimeline(shareData);
          }
        });
      };

      script.onerror = function () {
        if (settled) return;
        settled = true;
        fail('jweixin 脚本加载失败');
      };

      document.head.appendChild(script);

      /* 8 秒未就绪则放弃，避免长期占用 */
      setTimeout(function () {
        if (!settled) { settled = true; fail('加载超时'); }
      }, 8000);
    })
    .catch(function (e) {
      if (window.console) console.warn('[wechat-share] 签名请求失败：' + (e && e.message ? e.message : e));
    });
})();
