// 迁移：首页 team/services 两区静态 HTML → widget 占位 + settings 数据
const fs = require('fs');
const path = require('path');
const ROOT = 'E:/PC/网站';
const f = path.join(ROOT, 'data', 'site.json');
const d = JSON.parse(fs.readFileSync(f, 'utf8'));
let b = d.pages[0].body_html;

// 1) team 区：team-core(3卡) + team-row(3卡) → 占位
const teamRe = /<div class="team-core">[\s\S]*?<div class="team-row">[\s\S]*?<\/div>\s*(<\/div>)/;
const teamMatch = b.match(teamRe);
if (!teamMatch) { console.error('TEAM 未匹配'); process.exit(1); }
b = b.replace(teamRe, '<div class="team-core" data-widget="home-team"></div>\n  $1');

// 2) services 区：service-grid(8项) → 占位（保留 grid 闭合 + container + section 尾）
const svcRe = /<div class="service-grid">[\s\S]*?<\/div>\s*(<\/div>)/;
const svcMatch = b.match(svcRe);
if (!svcMatch) { console.error('SERVICES 未匹配'); process.exit(1); }
b = b.replace(svcRe, '<div class="service-grid" data-widget="home-services"></div>\n  $1');

d.pages[0].body_html = b;

// 3) settings 数据
const s = d.settings;
s.homeTeam = [
  { icon: 'ic-leaf', tag: '核心团队', name: '首席营养师', role: '人社部高级公共营养师 · 6 年+营养研究',
    items: ['本科医学专业，健康行业深耕 6 年余', '持高级公共营养师 / 高级健康管理师 / 高级养老护理员（人社部颁发）', '长期从事营养研究，专注产后饮食方案设计'],
    tags: ['人社部国家级证书', '6 年+'] },
  { icon: 'ic-heart', tag: '核心团队', name: '首席健康管理师', role: '健康管理师认证 · 健康行业 10 年+',
    items: ['2013 年进入健康行业，深耕一线照护与健康管理', '养老护理员初 / 中 / 高级持证，2024 年获健康管理师认证', '2023 年荣获「最美养老人」优秀护理员 · 护士技能比赛第三名'],
    tags: ['国家职业资格认证', '10 年+'] },
  { icon: 'ic-user', tag: '核心团队', name: '母婴护理专家', role: '本科护理学 · 护士资格证 + 初级护师',
    items: ['医护一线 10 年+（住院部护士 · 卫生院护士）', '持护士资格证 / 初级护师资格证 / 家政服务证书', '母婴护理机构从业经验，护理细节全程把关'],
    tags: ['护士资格+初级护师', '10 年+'] },
  { icon: 'ic-bowl', tag: '', name: '行政总厨', role: '滇菜名厨亲传 · 20 年+灶台功底',
    items: ['2005 年入行，师从中国滇菜烹饪大师张明华先生', '2018 年拜亚洲厨王孔祥道大师为师', '本地妇产机构月子餐主理多年'],
    tags: ['滇菜大师亲传', '20 年+'] },
  { icon: 'ic-spa', tag: '', name: '特聘中医顾问', role: '省名中医亲传 · 主治医师 / 高校讲师',
    items: ['师从云南省名中医朱智生教授', '中医美容主诊医师 · 省中医药学会培训中心特聘讲师', '主持厅级课题 3 项 · 发表论文多篇（含 SCI）'],
    tags: ['名中医亲传', '课题 + SCI'] },
  { icon: 'ic-shield', tag: '', name: '特聘西医顾问', role: '医学顾问 · 专业履历线下可查证',
    items: ['医学专业背景，临床经验丰富', '为餐品营养与产后调理方案提供专业把关', '证书与履历支持到店查阅核验'],
    tags: ['医学专业背景', '履历可查证'] }
];
s.homeServices = [
  { icon: 'ic-leaf', title: 'AI大数据 + 首席营养师体质辨识', desc: '入餐体质辨识，虚寒 / 燥热 / 平和分型匹配对应食谱' },
  { icon: 'ic-user', title: '专属营养师 1v1', desc: '饮食与恢复指导，到店 / 线上均可，问题当日响应' },
  { icon: 'ic-heart', title: '营养管家 · 一人一单', desc: '专属管家全程跟进，需求调整、忌口登记随时对接' },
  { icon: 'ic-cup', title: '陶瓷餐具回收消毒', desc: '定制 / 私配套餐可选陶瓷餐具，上门回收、专业消毒' },
  { icon: 'ic-truck', title: '精准时段配送', desc: '准点配送到家，私配套餐误差不超过 15 分钟' },
  { icon: 'ic-shield', title: '食材每日公示', desc: '每日食材信息公开、全流程可溯源，吃得明白放心' },
  { icon: 'ic-spa', title: '产康服务', desc: '合作门店专业产后修复项目，餐食与恢复方案联动定制' },
  { icon: 'ic-baby', title: '婴儿看护', desc: '新生儿专业护理指导与照护对接，让妈妈安心休养' }
];

fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf8');
console.log('迁移完成：team占位=' + (b.indexOf('data-widget="home-team"') >= 0) +
  ', services占位=' + (b.indexOf('data-widget="home-services"') >= 0) +
  ', homeTeam=' + s.homeTeam.length + ', homeServices=' + s.homeServices.length);
