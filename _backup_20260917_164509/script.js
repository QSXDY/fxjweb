/* ============================================================
   福鲜家 CMS · 首页专用脚本 script.js
   仅首页加载：价格表 / 每日均价图表 / 套餐详情弹窗 / 轮播 / 滚动显现
   数据优先取后台「站点设置」维护的 SITE_DATA，未配置时使用内置默认值
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 数据（默认值，可在后台「站点设置」中覆盖） ---------- */
  var SD = window.SITE_DATA || {};
  var MEAL_TYPES = (SD.mealTypes && SD.mealTypes.length === 4) ? SD.mealTypes : ["每日两餐", "每日三餐", "每日两餐两点", "每日三餐两点"];
  var TIER_NAMES = (SD.tierNames && SD.tierNames.length === 3) ? SD.tierNames : ["标准调养", "定制调理", "专属私配"];
  var DEFAULT_PRICES = {
    standard: { 14: [2070, 2590, 2490, 3010], 28: [3980, 4980, 4790, 5790], 42: [5770, 7220, 6950, 8400] },
    custom: { 14: [2280, 2850, 2740, 3310], 28: [4380, 5480, 5270, 6370], 42: [6350, 7950, 7640, 9240] },
    premium: { 14: [2490, 3110, 2990, 3610], 28: [4780, 5980, 5750, 6950], 42: [6930, 8670, 8340, 10080] }
  };
  var PRICES = SD.prices || DEFAULT_PRICES;

  var DEFAULT_DETAILS = {
    standard: {
      name: "标准调养套餐",
      groups: [
        { t: "餐食核心配置", items: [
          "排 / 调 / 补 / 养四阶段固定食谱，三菜一汤一主食，顺产 / 剖腹产基础区分",
          "入餐 1 次中医体质辨识，分虚寒 / 燥热 / 平和三类匹配对应食谱",
          "过敏、饮食偏好等基础忌口登记调整"
        ]},
        { t: "智能与溯源", items: [
          "自有小程序商城：每日餐品、食材来源在线溯源，食品安全一目了然",
          "AI 健康管理系统基础建档，每周推送恢复数据周报"
        ]},
        { t: "基础配套权益", items: [
          "免费到店试吃 1 次，可参观全开放厨房 + 餐品样品区",
          "每日食材公示，全流程可溯源",
          "母婴超市专属优惠（详询门店）"
        ]},
        { t: "专属增值服务", items: [
          "出院首日免费加赠传统食养汤方 1 份",
          "赠送电子版月子餐居家调理手册 / 婴儿满月照手册",
          "宝妈生日当天免费升级滋补餐 1 份"
        ]}
      ]
    },
    custom: {
      name: "定制调理套餐",
      groups: [
        { t: "餐食核心配置", items: [
          "分体质基础上，每周根据恢复反馈、奶量情况微调 1 次食谱",
          "每周固定 2 次优质滋补食材（花胶丁 / 海参碎）",
          "支持过敏、饮食偏好、哺乳期追奶 / 回奶等需求调整"
        ]},
        { t: "智能与溯源", items: [
          "自有小程序商城每日溯源，餐品与食材在线可查",
          "AI 健康管理系统档案动态更新，每周推送恢复周报"
        ]},
        { t: "基础配套权益", items: [
          "到店基础产后测评（气血、母乳情况、体脂评估）",
          "营养师 1v1 饮食 + 恢复指导（到店 / 线上均可）",
          "每周 1 次体质复评（到店 / 视频均可）",
          "家用分阶段调理茶饮包",
          "母婴超市专属优惠（详询门店）",
          "陶瓷餐具上门回收消毒",
          "家属餐专属优惠（详询门店）"
        ]},
        { t: "专属增值服务", items: [
          "免费上门体质评估 1 次",
          "赠送新生儿护理礼包 1 份",
          "免费加入宝妈交流社群，定期分享育儿知识",
          "订单可免费改期（提前 3 天告知）"
        ]}
      ]
    },
    premium: {
      name: "专属私配套餐",
      groups: [
        { t: "餐食核心配置", items: [
          "每周根据体检 / 恢复数据全量动态调整食谱",
          "每周高端滋补食材配送，优先选用有机蔬菜",
          "三餐三点 + 夜间滋养羹，餐品口味、食材偏好可随时调整"
        ]},
        { t: "智能与溯源", items: [
          "AI 健康管理系统全程档案管理 + 恢复趋势报告",
          "自有小程序每日溯源，食品安全全程可查"
        ]},
        { t: "基础配套权益", items: [
          "每周恢复测评，随时调整食谱",
          "专属营养师 + 健康管理师双人服务，问题当日响应",
          "定制款月子饮 + 泡脚包全套（按个人体质配伍）",
          "母婴超市专属优惠（详询门店）",
          "合作门店上门哺乳期护理支持",
          "精准时段配送，误差不超 15 分钟",
          "赠宝宝满月摄影券 + 新生儿护理指导 1 次"
        ]},
        { t: "专属增值服务", items: [
          "产后 42 天复查专属饮食指导",
          "赠送满月汗体验券",
          "宝妈 / 宝宝生日当天免费定制主题餐",
          "全年订餐优先配送权",
          "免费升级保温专属配送箱"
        ]}
      ]
    },
    short1: {
      name: "1 天 · 分娩日应急体验餐",
      groups: [
        { t: "套餐定位", items: [
          "临产发动当天、家人分身乏术期、临时改善伙食的救急方案",
          "当日 3 小时前预订，现做现发、一份也送"
        ]},
        { t: "服务内容", items: [
          "三菜一汤一主食，顺产 / 剖腹产基础分型",
          "基础忌口登记，快速体质建档",
          "赠送红糖姜茶 1 份"
        ]},
        { t: "升级权益", items: [
          "体验满意后升级 14 / 28 / 42 天套餐，1 天费用全额抵扣，只需补差价"
        ]}
      ]
    },
    short3: {
      name: "3 天 · 分娩餐（住院陪伴）",
      groups: [
        { t: "套餐定位", items: [
          "顺产住院 3 天 / 剖腹产住院初期 / 出院过渡首选",
          "同价位中服务内容更完整"
        ]},
        { t: "服务内容", items: [
          "每日两餐 / 三餐可选，三菜一汤一主食",
          "顺产 / 剖腹产分型配餐，产后分级过渡",
          "剖腹产分级：米油 → 半流质 → 软食，按恢复阶段自动递进",
          "免费中医体质辨识 1 次，入餐建档",
          "赠送出院传统食养汤方 1 份",
          "每日食材公示，全程可溯源"
        ]},
        { t: "升级权益", items: [
          "升级 14 / 28 / 42 天套餐，3 天费用全额抵扣，只需补差价"
        ]}
      ]
    },
    short7: {
      name: "7 天 · 产后第一周（产后排浊专护）",
      groups: [
        { t: "套餐定位", items: [
          "覆盖产后 1–7 天产后排浊关键期，四阶段调理之「排」完整落地",
          "为 28 / 42 天套餐打好恢复基础"
        ]},
        { t: "服务内容", items: [
          "产后排浊阶段食谱：传统食养汤方 · 麻油猪肝 · 红豆汤等",
          "剖腹产产后全程分级过渡（如适用）",
          "哺乳初期清淡汤水，避免过早大补",
          "营养管家 1v1 建档，每日跟进恢复情况",
          "每日现做配送，食材公示",
          "赠送电子版月子餐居家调理手册"
        ]},
        { t: "升级权益", items: [
          "升级 28 / 42 天套餐，7 天费用全额抵扣，只需补差价"
        ]}
      ]
    }
  };
  var DETAILS = SD.details || DEFAULT_DETAILS;

  var fmt = function (n) { return n.toLocaleString("zh-CN"); };

  /* ---------- 价格表切换 ---------- */
  var priceTabs = Array.prototype.slice.call(document.querySelectorAll(".price-tab"));
  var priceBody = document.getElementById("priceBody");

  function renderPriceTable(period) {
    if (!priceBody) return;
    var html = "";
    MEAL_TYPES.forEach(function (meal, mi) {
      html += "<tr><td>" + meal + "</td>";
      ["standard", "custom", "premium"].forEach(function (tier) {
        var v = PRICES[tier] && PRICES[tier][period] && PRICES[tier][period][mi];
        html += '<td class="price-cell">¥' + (v == null ? "—" : fmt(v)) + "</td>";
      });
      html += "</tr>";
    });
    priceBody.innerHTML = html;
  }

  priceTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      priceTabs.forEach(function (t) {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-selected", String(t === tab));
      });
      renderPriceTable(Number(tab.getAttribute("data-period")));
    });
  });
  renderPriceTable(14);

  /* ---------- 每日均价 ECharts ---------- */
  var chartEl = document.getElementById("dailyAvgChart");
  if (chartEl) {
    function buildDaily() {
      var periods = [14, 28, 42];
      return ["standard", "custom", "premium"].map(function (tier, ti) {
        return {
          name: TIER_NAMES[ti],
          type: "bar",
          barWidth: chartEl.getBoundingClientRect().width < 600 ? 20 : 46,
          barGap: "25%",
          barCategoryGap: "40%",
          data: periods.map(function (p) {
            var v = PRICES[tier] && PRICES[tier][p] && PRICES[tier][p][1];
            return v == null ? null : Math.round(v / p);
          })
        };
      });
    }

    function renderChart() {
      if (typeof window.echarts === "undefined") {
        chartEl.innerHTML = '<p style="text-align:center;color:#87918C;padding-top:120px;">图表加载失败，请参考上方价格表，或致电 199 8990 1658 咨询。</p>';
        return;
      }
      var chart = window.echarts.init(chartEl);
      chart.setOption({
        color: ["#C2A15C", "#7EBDBA", "#548A7E"],
        tooltip: {
          trigger: "axis",
          backgroundColor: "#25322E",
          borderWidth: 0,
          textStyle: { color: "#fff", fontFamily: "MiSans, PingFang SC, Microsoft YaHei, sans-serif" },
          formatter: function (ps) {
            if (!ps || !ps.length) return "";
            var s = ps[0].axisValue + "（每日三餐）<br/>";
            ps.forEach(function (p) {
              s += p.marker + p.seriesName + "：约 ¥" + p.value + "/天<br/>";
            });
            return s;
          }
        },
        legend: {
          top: 0, right: 0,
          itemWidth: 12, itemHeight: 12,
          textStyle: { color: "#57625E", fontSize: 12.5, fontFamily: "MiSans, PingFang SC, Microsoft YaHei, sans-serif" }
        },
        grid: { left: 12, right: 12, top: 44, bottom: 8, containLabel: true },
        xAxis: {
          type: "category",
          data: ["14 天", "28 天", "42 天"],
          axisLine: { lineStyle: { color: "#D2C6AA" } },
          axisTick: { show: false },
          axisLabel: { color: "#57625E", fontSize: 13, fontFamily: "MiSans, PingFang SC, Microsoft YaHei, sans-serif" }
        },
        yAxis: {
          type: "value",
          name: "元/天",
          nameTextStyle: { color: "#87918C", fontSize: 11.5 },
          axisLabel: { color: "#87918C", fontSize: 12, fontFamily: "MiSans, PingFang SC, Microsoft YaHei, sans-serif" },
          splitLine: { lineStyle: { color: "#E6EDE9", type: "dashed" } }
        },
        series: buildDaily().map(function (s) {
          s.label = {
            show: true, position: "top", color: "#57625E",
            fontSize: 11.5, fontFamily: "MiSans, PingFang SC, Microsoft YaHei, sans-serif",
            formatter: "¥{c}"
          };
          s.itemStyle = { borderRadius: [7, 7, 0, 0] };
          return s;
        })
      });
      window.addEventListener("resize", function () { chart.resize(); });
    }
    renderChart();
  }

  /* ---------- 套餐详情弹窗 ---------- */
  var modal = document.getElementById("planModal");
  var modalBody = document.getElementById("modalBody");
  var modalTitle = document.getElementById("modalTitle");

  function openModal(tier) {
    var d = DETAILS[tier];
    if (!d || !modal) return;
    modalTitle.textContent = d.name;
    var html = "";
    (d.groups || []).forEach(function (g) {
      html += '<div class="modal-group"><h3>' + g.t + "</h3><ul>";
      (g.items || []).forEach(function (it) { html += "<li>" + it + "</li>"; });
      html += "</ul></div>";
    });
    html += '<p style="font-size:12.5px;color:#87918C;">* 28 / 42 天周期对应更多测评次数与加赠权益，具体以门店咨询为准。</p>';
    modalBody.innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  document.querySelectorAll("[data-detail]").forEach(function (btn) {
    btn.addEventListener("click", function () { openModal(btn.getAttribute("data-detail")); });
  });

  /* ---------- Hero 轮播 ---------- */
  var heroTrack = document.getElementById("heroTrack");
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var dotsWrap = document.getElementById("heroDots");
  var prevBtn = document.getElementById("heroPrev");
  var nextBtn = document.getElementById("heroNext");
  var heroSec = document.querySelector(".hero");

  if (heroTrack && slides.length && dotsWrap && prevBtn && nextBtn && heroSec) {
    var current = 0;
    var autoTimer = null;
    var AUTO_MS = 5000;

    slides.forEach(function (_, i) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "第 " + (i + 1) + " 张");
      b.addEventListener("click", function () { goTo(i); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function goTo(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, idx) { s.classList.toggle("is-active", idx === current); });
      dots.forEach(function (d, idx) { d.classList.toggle("is-active", idx === current); });
    }
    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }
    function start() {
      stop();
      autoTimer = setInterval(next, AUTO_MS);
    }
    function stop() { clearInterval(autoTimer); }
    function restart() { start(); }

    prevBtn.addEventListener("click", function () { prev(); restart(); });
    nextBtn.addEventListener("click", function () { next(); restart(); });

    heroSec.addEventListener("mouseenter", stop);
    heroSec.addEventListener("mouseleave", start);

    var touchX = 0;
    heroSec.addEventListener("touchstart", function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    heroSec.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 48) {
        if (dx < 0) next(); else prev();
        restart();
      }
    }, { passive: true });

    goTo(0);
    start();
  }

  /* ---------- 滚动显现 ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();
