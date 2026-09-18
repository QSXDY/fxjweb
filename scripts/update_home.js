/* ============================================================
 * 重写首页 body_html：品牌首页（hero → 门店实力 → 品牌故事 →
 * 5 条套餐线入口区(plan-entries 占位) → 专家团队 → AI →
 * 服务保障(含产康/看护) → 咨询区 → 联系）
 * 运行：node scripts/update_home.js
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'site.json');
const INITIAL_FILE = path.join(ROOT, 'initial-site.json');

const HOME_HTML = `
<!-- ① 品牌主视觉 hero：全家人健康餐桌 -->
<section aria-label="福鲜家营养餐介绍" class="hero">
  <div id="heroTrack" class="hero-track">
    <article class="hero-slide is-active">
      <img src="/uploads/top/2026-09/1789575018000-5351c839.webp" alt="福鲜家营养餐三菜一汤一主食全景" class="hero-img"/>
      <div class="hero-mask"></div>
      <div class="hero-copy container">
        <p class="eyebrow"><span class="line"></span>昭通 · 福鲜家营养餐<span class="line"></span></p>
        <h1>全家人的健康餐桌<br/>从一餐一饭开始</h1>
        <p class="hero-sub">月子餐 · 备孕餐 · 控脂轻食 · 产后修复 · 术后康复 · 一人一方定制配送</p>
        <div class="hero-actions">
          <a data-action="consult" href="/tel:19989901658" class="btn btn-gold"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"></use></svg>立即咨询</a>
          <a href="/#plans" class="btn btn-line">查看套餐方案</a>
        </div>
      </div>
    </article>
    <article class="hero-slide">
      <img src="/uploads/top/2026-09/1789575018000-8348da27.webp" alt="花胶海参鸡汤滋补炖盅" class="hero-img"/>
      <div class="hero-mask"></div>
      <div class="hero-copy container">
        <p class="eyebrow"><span class="line"></span>五条定制餐线<span class="line"></span></p>
        <h2>不止月子餐<br/>全家人都有一份专属方案</h2>
        <p class="hero-sub">备孕调理 · 控脂轻食 · 产后修复 · 术后康复，按体质分型配餐</p>
        <div class="hero-actions">
          <a data-action="consult" href="/tel:19989901658" class="btn btn-gold"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"></use></svg>立即咨询</a>
          <a href="/#plans" class="btn btn-line">选择您的方案</a>
        </div>
      </div>
    </article>
    <article class="hero-slide">
      <img src="/uploads/top/2026-09/1789575018000-dc75924b.webp" alt="燕窝桃胶银耳羹精致甜品" class="hero-img"/>
      <div class="hero-mask"></div>
      <div class="hero-copy container">
        <p class="eyebrow"><span class="line"></span>每日现做现发<span class="line"></span></p>
        <h2>营养与美味兼得<br/>滋补汤羹 每日相伴</h2>
        <p class="hero-sub">花胶、海参等滋补食材，按需配入每周食谱</p>
        <div class="hero-actions">
          <a data-action="consult" href="/tel:19989901658" class="btn btn-gold"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"></use></svg>立即咨询</a>
          <a href="/#plans" class="btn btn-line">选择专属套餐</a>
        </div>
      </div>
    </article>
    <article class="hero-slide">
      <img src="/uploads/top/2026-09/1789575018000-85b88bef.webp" alt="新鲜三文鱼鲜虾蔬菜等健康食材" class="hero-img"/>
      <div class="hero-mask"></div>
      <div class="hero-copy container">
        <p class="eyebrow"><span class="line"></span>新鲜看得见<span class="line"></span></p>
        <h2>每日现做现发<br/>食材公示 全程可溯源</h2>
        <p class="hero-sub">实体门店开放厨房，随时到店参观、试吃</p>
        <div class="hero-actions">
          <a data-action="consult" href="/tel:19989901658" class="btn btn-gold"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"></use></svg>立即咨询</a>
          <a href="/#about" class="btn btn-line">走进福鲜家</a>
        </div>
      </div>
    </article>
  </div>
  <button id="heroPrev" aria-label="上一张" class="hero-arrow prev"><svg viewBox="0 0 24 24"><use href="#ic-chev-l" xlink:href="#ic-chev-l"></use></svg></button>
  <button id="heroNext" aria-label="下一张" class="hero-arrow next"><svg viewBox="0 0 24 24"><use href="#ic-arrow" xlink:href="#ic-arrow"></use></svg></button>
  <div id="heroDots" role="tablist" aria-label="轮播切换" class="hero-dots"></div>
</section>

<!-- ② 门店实力 -->
<section aria-label="品牌优势" class="trustbar"><div class="container trust-grid">
  <div class="trust-item"><span class="trust-ic"><svg viewBox="0 0 24 24"><use href="#ic-bowl" xlink:href="#ic-bowl"></use></svg></span><p><strong>实体门店</strong><em>开放式明厨，制作过程可见</em></p></div>
  <div class="trust-item"><span class="trust-ic"><svg viewBox="0 0 24 24"><use href="#ic-flame" xlink:href="#ic-flame"></use></svg></span><p><strong>每日现做</strong><em>传统工艺，拒绝速冻与半成品</em></p></div>
  <div class="trust-item"><span class="trust-ic"><svg viewBox="0 0 24 24"><use href="#ic-leaf" xlink:href="#ic-leaf"></use></svg></span><p><strong>体质辨识</strong><em>一人一方，分型配餐</em></p></div>
  <div class="trust-item"><span class="trust-ic"><svg viewBox="0 0 24 24"><use href="#ic-shield" xlink:href="#ic-shield"></use></svg></span><p><strong>食材公示</strong><em>每日更新，全程可溯源</em></p></div>
</div></section>

<!-- ③ 品牌故事 -->
<section id="about" class="section about">
  <div class="container about-grid">
    <div class="about-media reveal"><img src="/uploads/general/2026-09/1789575018000-c3f57786.webp" alt="福鲜家开放式明厨现做营养餐" loading="lazy" decoding="async"/>
      <div class="about-badge"><svg viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"></use></svg><span>全开放厨房 · 欢迎到店参观</span></div>
    </div>
    <div class="about-copy reveal">
      <p class="eyebrow-left"><span class="line"></span>关于福鲜家</p>
      <h2>用心做好每一餐</h2>
      <p class="lead">昭通福鲜家营养餐，实体门店每日现做现发。我们以传统烹饪工艺还原食材本味，不依赖中央厨房批量生产，不使用速冻、半成品与科技调料，让全家人的每一餐都新鲜、真实、有温度。</p>
      <ul class="about-list">
        <li><svg viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"></use></svg><span><strong>实体门店 · 开放明厨</strong>制作过程随时可见，到店免费试吃</span></li>
        <li><svg viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"></use></svg><span><strong>传统工艺 · 现做现发</strong>拒绝速冻与半成品，保留食材本味与营养</span></li>
        <li><svg viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"></use></svg><span><strong>一人一单 · 营养管家</strong>专属跟进，沟通需求随叫随应</span></li>
        <li><svg viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"></use></svg><span><strong>食材公示 · 全程溯源</strong>每日更新食材信息，吃得明白放心</span></li>
      </ul>
      <div class="about-actions">
        <a data-action="booking" href="/tel:19989901658" class="btn btn-deep"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"></use></svg>预约到店试吃</a>
        <span class="about-note">限量预定 · 建议提前 1 天预约</span>
      </div>
    </div>
  </div>
</section>

<!-- ④ 5 条套餐线入口区（后台「套餐方案」管理，自动渲染） -->
<section id="plans" class="section plans">
  <div class="container">
    <div class="sec-head reveal">
      <p class="eyebrow-center"><span class="line"></span>套餐方案<span class="line"></span></p>
      <h2>全家人的健康餐桌 · 五条定制餐线</h2>
      <p class="sec-sub">不止月子餐。备孕、控脂、产后修复、术后康复，为每个家庭角色准备一份专属方案。</p>
    </div>
    <div data-widget="plan-entries" class="plan-entry-grid"></div>
  </div>
</section>

<!-- ⑤ 专家团队 -->
<section id="team" class="section team">
  <div class="container">
    <div class="sec-head reveal">
      <p class="eyebrow-center"><span class="line"></span>专家团队<span class="line"></span></p>
      <h2>一人一方 · 背后的专业力量</h2>
      <p class="sec-sub">全员持国家级证书 · 健康 / 餐饮行业深耕 5 年+ · 支持线下查看证书与工作证明</p>
    </div>
    <div class="team-core">
      <article class="team-card team-featured reveal">
        <div class="team-top"><span class="team-ic"><svg viewBox="0 0 24 24"><use href="#ic-leaf" xlink:href="#ic-leaf"></use></svg></span><span class="team-core-tag">核心团队</span></div>
        <h3>首席营养师</h3>
        <p class="team-role">人社部高级公共营养师 · 6 年+营养研究</p>
        <ul class="team-list">
          <li>本科医学专业，健康行业深耕 6 年余</li>
          <li>持高级公共营养师 / 高级健康管理师 / 高级养老护理员（人社部颁发）</li>
          <li>长期从事营养研究，专注产后饮食方案设计</li>
        </ul>
        <div class="team-tags"><span>人社部国家级证书</span><span>6 年+</span></div>
      </article>
      <article class="team-card team-featured reveal">
        <div class="team-top"><span class="team-ic"><svg viewBox="0 0 24 24"><use href="#ic-heart" xlink:href="#ic-heart"></use></svg></span><span class="team-core-tag">核心团队</span></div>
        <h3>首席健康管理师</h3>
        <p class="team-role">健康管理师认证 · 健康行业 10 年+</p>
        <ul class="team-list">
          <li>2013 年进入健康行业，深耕一线照护与健康管理</li>
          <li>养老护理员初 / 中 / 高级持证，2024 年获健康管理师认证</li>
          <li>2023 年荣获「最美养老人」优秀护理员 · 护士技能比赛第三名</li>
        </ul>
        <div class="team-tags"><span>国家职业资格认证</span><span>10 年+</span></div>
      </article>
      <article class="team-card team-featured reveal">
        <div class="team-top"><span class="team-ic"><svg viewBox="0 0 24 24"><use href="#ic-user" xlink:href="#ic-user"></use></svg></span><span class="team-core-tag">核心团队</span></div>
        <h3>母婴护理专家</h3>
        <p class="team-role">本科护理学 · 护士资格证 + 初级护师</p>
        <ul class="team-list">
          <li>医护一线 10 年+（住院部护士 · 卫生院护士）</li>
          <li>持护士资格证 / 初级护师资格证 / 家政服务证书</li>
          <li>母婴护理机构从业经验，护理细节全程把关</li>
        </ul>
        <div class="team-tags"><span>护士资格+初级护师</span><span>10 年+</span></div>
      </article>
    </div>
    <div class="team-row">
      <article class="team-card reveal">
        <div class="team-top"><span class="team-ic"><svg viewBox="0 0 24 24"><use href="#ic-bowl" xlink:href="#ic-bowl"></use></svg></span></div>
        <h3>行政总厨</h3>
        <p class="team-role">滇菜名厨亲传 · 20 年+灶台功底</p>
        <ul class="team-list">
          <li>2005 年入行，师从中国滇菜烹饪大师张明华先生</li>
          <li>2018 年拜亚洲厨王孔祥道大师为师</li>
          <li>本地妇产机构月子餐主理多年</li>
        </ul>
        <div class="team-tags"><span>滇菜大师亲传</span><span>20 年+</span></div>
      </article>
      <article class="team-card reveal">
        <div class="team-top"><span class="team-ic"><svg viewBox="0 0 24 24"><use href="#ic-spa" xlink:href="#ic-spa"></use></svg></span></div>
        <h3>特聘中医顾问</h3>
        <p class="team-role">省名中医亲传 · 主治医师 / 高校讲师</p>
        <ul class="team-list">
          <li>师从云南省名中医朱智生教授</li>
          <li>中医美容主诊医师 · 省中医药学会培训中心特聘讲师</li>
          <li>主持厅级课题 3 项 · 发表论文多篇（含 SCI）</li>
        </ul>
        <div class="team-tags"><span>名中医亲传</span><span>课题 + SCI</span></div>
      </article>
      <article class="team-card reveal">
        <div class="team-top"><span class="team-ic"><svg viewBox="0 0 24 24"><use href="#ic-shield" xlink:href="#ic-shield"></use></svg></span></div>
        <h3>特聘西医顾问</h3>
        <p class="team-role">医学顾问 · 专业履历线下可查证</p>
        <ul class="team-list">
          <li>医学专业背景，临床经验丰富</li>
          <li>为餐品营养与产后调理方案提供专业把关</li>
          <li>证书与履历支持到店查阅核验</li>
        </ul>
        <div class="team-tags"><span>医学专业背景</span><span>履历可查证</span></div>
      </article>
    </div>
  </div>
</section>

<!-- ⑥ AI 健康管理 -->
<section id="ai" class="section ai">
  <div class="container">
    <div class="sec-head reveal">
      <p class="eyebrow-center"><span class="line"></span>AI · 溯源<span class="line"></span></p>
      <h2>自研 AI 健康管理系统<br/>让每一餐更懂你</h2>
      <p class="sec-sub">自有小程序每日溯源 · AI 系统经多所医学高校临床验证</p>
    </div>
    <div class="ai-grid">
      <article class="ai-card reveal">
        <div class="ai-media"><img src="/uploads/general/2026-09/1789575018000-68870937.webp" alt="自研 AI 健康管理系统数据面板" loading="lazy" decoding="async"/></div>
        <div class="ai-body">
          <h3>AI 健康管理系统 <span>自研 · 已上线</span></h3>
          <ul class="ai-list">
            <li><svg viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"></use></svg>经多所医学高校临床验证，专业可信</li>
            <li><svg viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"></use></svg>行业领先病例大数据库，为食谱提供数据支撑</li>
            <li><svg viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"></use></svg>恢复节奏与饮食需求动态匹配，越吃越对</li>
          </ul>
        </div>
      </article>
      <article class="ai-card reveal">
        <div class="ai-media"><img src="/uploads/general/2026-09/1789575018000-518001d0.webp" alt="自有小程序商城每日溯源" loading="lazy" decoding="async"/></div>
        <div class="ai-body">
          <h3>自有小程序商城 <span>每日溯源</span></h3>
          <ul class="ai-list">
            <li><svg viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"></use></svg>餐品与食材来源在线可查，一目了然</li>
            <li><svg viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"></use></svg>食品安全每日公示，吃得明白放心</li>
            <li><svg viewBox="0 0 24 24"><use href="#ic-check" xlink:href="#ic-check"></use></svg>在线下单 · 改期 · 备注，一键完成</li>
          </ul>
          <div class="ai-actions"><a data-action="miniprogram" href="#ai" class="btn btn-deep">进入小程序商城</a></div>
        </div>
      </article>
    </div>
    <div class="ai-stats reveal">
      <div><strong>多所</strong><span>医学高校临床验证</span></div>
      <div><strong>行业领先</strong><span>病例大数据库</span></div>
      <div><strong>AI 建档</strong><span>每周恢复复评</span></div>
    </div>
  </div>
</section>

<!-- ⑦ 服务保障（含产康服务 / 婴儿看护） -->
<section id="services" class="section services">
  <div class="container">
    <div class="sec-head reveal">
      <p class="eyebrow-center"><span class="line"></span>服务保障<span class="line"></span></p>
      <h2>不止是送餐<br/>是一整套健康饮食守护</h2>
    </div>
    <div class="service-grid">
      <div class="service-item reveal"><span class="service-ic"><svg viewBox="0 0 24 24"><use href="#ic-leaf" xlink:href="#ic-leaf"></use></svg></span><h3>AI大数据 + 首席营养师体质辨识</h3><p>入餐体质辨识，虚寒 / 燥热 / 平和分型匹配对应食谱</p></div>
      <div class="service-item reveal"><span class="service-ic"><svg viewBox="0 0 24 24"><use href="#ic-user" xlink:href="#ic-user"></use></svg></span><h3>专属营养师 1v1</h3><p>饮食与恢复指导，到店 / 线上均可，问题当日响应</p></div>
      <div class="service-item reveal"><span class="service-ic"><svg viewBox="0 0 24 24"><use href="#ic-heart" xlink:href="#ic-heart"></use></svg></span><h3>营养管家 · 一人一单</h3><p>专属管家全程跟进，需求调整、忌口登记随时对接</p></div>
      <div class="service-item reveal"><span class="service-ic"><svg viewBox="0 0 24 24"><use href="#ic-cup" xlink:href="#ic-cup"></use></svg></span><h3>陶瓷餐具回收消毒</h3><p>定制 / 私配套餐可选陶瓷餐具，上门回收、专业消毒</p></div>
      <div class="service-item reveal"><span class="service-ic"><svg viewBox="0 0 24 24"><use href="#ic-truck" xlink:href="#ic-truck"></use></svg></span><h3>精准时段配送</h3><p>准点配送到家，私配套餐误差不超过 15 分钟</p></div>
      <div class="service-item reveal"><span class="service-ic"><svg viewBox="0 0 24 24"><use href="#ic-shield" xlink:href="#ic-shield"></use></svg></span><h3>食材每日公示</h3><p>每日食材信息公开、全流程可溯源，吃得明白放心</p></div>
      <div class="service-item reveal"><span class="service-ic"><svg viewBox="0 0 24 24"><use href="#ic-spa" xlink:href="#ic-spa"></use></svg></span><h3>产康服务</h3><p>合作门店专业产后修复项目，餐食与恢复方案联动定制</p></div>
      <div class="service-item reveal"><span class="service-ic"><svg viewBox="0 0 24 24"><use href="#ic-baby" xlink:href="#ic-baby"></use></svg></span><h3>婴儿看护</h3><p>新生儿专业护理指导与照护对接，让妈妈安心休养</p></div>
    </div>
  </div>
</section>

<!-- ⑧ 专属方案咨询区 -->
<section id="quote" class="section quote-section">
  <div class="container">
    <div class="quote-inner reveal">
      <p class="eyebrow-center"><span class="line"></span>专属方案<span class="line"></span></p>
      <h2>每一份餐食，都为你专属定制</h2>
      <p class="quote-lead">我们的营养师与中医顾问会根据你的体质、阶段与口味偏好，一对一制定专属调理方案。<br/>服务内容与周期均可按需组合，欢迎来电或添加微信了解详情。</p>
      <div class="quote-actions">
        <a data-action="consult" href="/tel:19989901658" class="btn btn-gold-lg"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"></use></svg>电话咨询专属方案</a>
        <button id="quoteCopyWx" class="btn btn-cream-lg"><svg viewBox="0 0 24 24"><use href="#ic-wechat" xlink:href="#ic-wechat"></use></svg>添加微信了解详情</button>
      </div>
      <p class="quote-note">到店可免费试吃 · 参观全开放厨房；所有方案均以门店沟通为准。</p>
    </div>
  </div>
</section>

<!-- ⑨ 联系我们 -->
<section id="contact" class="section contact">
  <div class="container">
    <div class="contact-box reveal">
      <div class="contact-info">
        <p class="eyebrow-left"><span class="line"></span>联系我们</p>
        <h2>不方便到店？<br/>线上也能快速了解方案</h2>
        <p class="contact-lead">拨打电话或添加微信，销售顾问一对一解答套餐内容、服务细节与专属调理方案。</p>
        <ul class="contact-list">
          <li><span class="c-ic"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"></use></svg></span><p><em>咨询电话</em><a data-action="consult" href="/tel:19989901658"><strong>199 8990 1658</strong></a></p></li>
          <li><span class="c-ic"><svg viewBox="0 0 24 24"><use href="#ic-wechat" xlink:href="#ic-wechat"></use></svg></span><p><em>微信号</em><span class="wx-row"><strong id="wxId">ZTFXJ1689</strong><button id="copyWx" class="btn-copy">复制</button></span></p></li>
          <li><span class="c-ic"><svg viewBox="0 0 24 24"><use href="#ic-pin" xlink:href="#ic-pin"></use></svg></span><p><em>门店地址</em><strong>昭通市昭阳区省耕山水 1 号地块 8 号电梯 4 楼</strong></p></li>
          <li><span class="c-ic"><svg viewBox="0 0 24 24"><use href="#ic-clock" xlink:href="#ic-clock"></use></svg></span><p><em>营业时间</em><strong>周一至周日 9:00 – 19:00</strong></p></li>
        </ul>
        <div class="contact-actions">
          <a data-action="consult" href="/tel:19989901658" class="btn btn-gold btn-lg"><svg viewBox="0 0 24 24"><use href="#ic-phone" xlink:href="#ic-phone"></use></svg>立即拨打电话</a>
          <button id="copyWx2" class="btn btn-deep btn-lg"><svg viewBox="0 0 24 24"><use href="#ic-wechat" xlink:href="#ic-wechat"></use></svg>复制微信号</button>
        </div>
      </div>
      <div class="contact-qr">
        <img src="/uploads/contact/2026-09/1789571940000-6d50b470.webp" alt="福鲜家营养餐微信二维码"/>
        <p><strong>扫码添加微信</strong><span>一对一咨询 · 免费试吃预约</span></p>
      </div>
    </div>
  </div>
</section>
`;

function applyTo(d) {
  const home = d.pages.find(function (p) { return p.is_home; });
  if (!home) throw new Error('未找到首页页面');
  home.title = '福鲜家营养餐｜昭通定制营养餐配送 · 月子餐 · 备孕餐 · 控脂 · 产后修复 · 术后康复';
  home.meta = '昭通福鲜家营养餐，实体门店每日现做：月子餐、备孕餐、控脂轻食、产后修复、术后康复五条定制餐线，一人一方分型配餐，食材每日公示可溯源。';
  home.body_html = HOME_HTML.trim();
  home.needs_home_js = true;
  home.updated_at = new Date().toISOString();
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
applyTo(data);
fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
console.log('[home] site.json 首页已重写');

if (fs.existsSync(INITIAL_FILE)) {
  const ini = JSON.parse(fs.readFileSync(INITIAL_FILE, 'utf8'));
  applyTo(ini);
  fs.writeFileSync(INITIAL_FILE, JSON.stringify(ini, null, 2), 'utf8');
  console.log('[home] initial-site.json 已同步');
}
