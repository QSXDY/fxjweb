const fs = require('fs');
const adds = {
  kongzhi: [
    { days: "15 天", name: "半月塑形期", tag: "体脂明显变化",
      desc: "15 天系统控脂，看到体脂和围度变化",
      points: ["周度体脂秤数据追踪", "营养师每周餐单微调", "费用可抵扣升级长期套餐"] }
  ],
  chanhou: [
    { days: "15 天", name: "产后修复期", tag: "气血基础重建",
      desc: "产后第二周起，气血与体型同步修复",
      points: ["瘦身 + 补气血双向食谱", "基础体能恢复评估", "费用可抵扣升级长期方案"] }
  ],
  yuezi: [
    { days: "15 天", name: "月子中期", tag: "调和温补",
      desc: "产后 8-22 天，身体恢复黄金期",
      points: ["传统食养汤方 · 温补不燥", "哺乳汤水 · 促进乳汁分泌", "升级 28/42 天费用全额抵扣"] },
    { days: "30 天", name: "满月月子餐", tag: "完整月子调理",
      desc: "完整 30 天月子期，排·调·补·养四阶段",
      points: ["四阶段科学调理 · 每周营养师跟进", "月子期间无限次体质咨询", "出月赠产后修复餐 3 天"] }
  ]
};
for (const f of ['data/site.json', 'initial-site.json']) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const lines = j.settings.planLines;
  for (const [k, l] of Object.entries(lines)) {
    const add = adds[l.slug];
    if (!add) continue;
    const sp = l.shortPlans || [];
    for (const p of add) {
      if (!sp.some(x => x.days === p.days)) sp.push(p);
    }
    l.shortPlans = sp;
  }
  fs.writeFileSync(f, JSON.stringify(j, null, 2));
  console.log('OK', f);
  for (const [k, l] of Object.entries(lines)) {
    console.log(' ', l.slug, '→', (l.shortPlans||[]).map(p => p.days).join(', '));
  }
}
