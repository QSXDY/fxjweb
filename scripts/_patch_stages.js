/* 补丁：planLines 补 stages 图标/代表餐品；beiyun/kongzhi/chanhou 补调理路径；tiers 加 img(占位 hero，AI 图后替换) */
'use strict';
const fs = require('fs');

const DATA = 'E:/PC/网站/data/site.json';
const INIT = 'E:/PC/网站/initial-site.json';

const STAGES = {
  yuezi: [
    { icon: 'ic-drop', n: '排', t: '第一周 · 排', d: '产后第 1 周宜清淡，先排后补更科学，生化汤加持，避免过早进补影响哺乳', dish: '代表餐品 · 生化汤 · 小米粥 · 冬瓜排骨汤' },
    { icon: 'ic-leaf', n: '调', t: '第二周 · 调', d: '调理脾胃与气血，循序渐进补充营养，为泌乳与恢复打基础', dish: '代表餐品 · 山药炖品 · 猪肝菠菜汤' },
    { icon: 'ic-heart', n: '补', t: '第三周 · 补', d: '渐进进补阶段，滋补汤方逐步加码，助力气血与体力恢复', dish: '代表餐品 · 花胶鸡汤 · 海参蒸蛋 · 鲫鱼豆腐汤' },
    { icon: 'ic-spa', n: '养', t: '第四周 · 养', d: '固本培元，巩固恢复成果，平稳过渡到正常饮食', dish: '代表餐品 · 燕窝羹 · 药膳炖品 · 时令鲜蔬' }
  ],
  beiyun: [
    { icon: 'ic-flame', n: '暖宫养精', t: '调理期 · 暖宫养精', d: '以温补食材改善体寒体质，为受孕打好「土壤」基础', dish: '代表餐品 · 红枣枸杞山药粥 · 阿胶糕 · 姜枣茶' },
    { icon: 'ic-pulse', n: '排卵周期调理', t: '排卵期 · 动态调餐', d: '按排卵周期动态调整膳食，男女分餐同步养精', dish: '代表餐品 · 海参丁蒸蛋 · 核桃坚果 · 黑豆浆' },
    { icon: 'ic-heart', n: '着床固护', t: '着床期 · 温和固护', d: '黄体期温和饮食、避免寒凉，为受精卵着床提供支持', dish: '代表餐品 · 番茄牛腩汤 · 杂粮饭 · 清蒸鱼' }
  ],
  kongzhi: [
    { icon: 'ic-leaf', n: '启动适应', t: '第 1-2 周 · 适应启动', d: '热量分级启动，让身体平稳过渡到低卡高蛋白饮食节奏', dish: '代表餐品 · 三文鱼藜麦沙拉 · 鸡胸时蔬 · 燕麦粥' },
    { icon: 'ic-flame', n: '平台突破', t: '第 3-4 周 · 平台突破', d: '数据化复盘，调整宏量营养比例，科学突破平台期', dish: '代表餐品 · 清蒸鳕鱼 · 杂粮饭 · 牛油果' },
    { icon: 'ic-shield', n: '巩固维持', t: '第 5 周起 · 巩固维持', d: '逐步恢复热量弹性，建立可持续的健康饮食习惯', dish: '代表餐品 · 香煎鸡胸 · 时蔬全麦 · 无糖酸奶' }
  ],
  chanhou: [
    { icon: 'ic-drop', n: '排浊修复', t: '产后 1-2 周 · 排浊修复', d: '清淡排浊，兼顾伤口恢复与泌乳基础', dish: '代表餐品 · 麻油猪肝 · 红豆汤 · 清蒸鲈鱼' },
    { icon: 'ic-heart', n: '气血恢复', t: '产后 3-4 周 · 气血恢复', d: '药食同源补气血，助力体力与乳汁质量双恢复', dish: '代表餐品 · 红枣当归鸡汤 · 猪蹄花生汤 · 菠菜猪肝' },
    { icon: 'ic-spa', n: '形体塑形', t: '产后 5 周起 · 形体塑形', d: '控脂增肌双线并进，瘦身不伤气血', dish: '代表餐品 · 鸡胸杂粮饭 · 时蔬虾仁 · 低脂酸奶' }
  ],
  shuhou: [
    { icon: 'ic-drop', n: '流食期', t: '术后 1-3 天 · 流食期', d: '以米油、清汤等流食减轻肠胃负担，逐步建立耐受', dish: '代表餐品 · 米油 · 清鸡汤 · 藕粉' },
    { icon: 'ic-leaf', n: '半流食 · 软食期', t: '术后 4-7 天 · 分级过渡', d: '细腻易消化，兼顾伤口修复所需营养', dish: '代表餐品 · 肉末粥 · 蒸蛋羹 · 鱼蓉粥' },
    { icon: 'ic-heart', n: '普食恢复期', t: '术后 2 周起 · 普食恢复', d: '少食多餐、分时配送，滋补伤口与体力恢复', dish: '代表餐品 · 清蒸鱼 · 炖鸡汤 · 软烂时蔬' }
  ]
};

function patch(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const pl = d.settings.planLines;
  let cnt = 0;
  Object.keys(STAGES).forEach(function (slug) {
    if (!pl[slug]) return;
    pl[slug].stages = STAGES[slug];
    // tiers 预留 img（先占 hero，后续 AI 图替换）
    (pl[slug].tiers || []).forEach(function (t) {
      if (!t.img) t.img = pl[slug].hero || '';
    });
    cnt++;
  });
  fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
  return cnt;
}

console.log('site.json 补丁:', patch(DATA) + ' 条餐线');
console.log('initial-site.json 补丁:', patch(INIT) + ' 条餐线');
