const fs = require('fs');
const shuhouAdds = [
  { days: "14 天", name: "出院过渡", tag: "两周康复期",
    desc: "出院后两周，居家饮食逐步过渡到正常",
    points: ["高蛋白低刺激 · 易消化食材", "一周体质评估 · 餐单微调", "费用可抵扣升级长期方案"] },
  { days: "28 天", name: "满月康复餐", tag: "完整康复周期",
    desc: "28 天完整康复周期，体力与营养全面恢复",
    points: ["四阶段康复食谱 · 每周营养师跟进", "术后忌口清单 · 食材可溯源", "出营赠复查营养餐 3 天"] }
];
for (const f of ['data/site.json', 'initial-site.json']) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const lines = j.settings.planLines;
  for (const [k, l] of Object.entries(lines)) {
    const sp = l.shortPlans || [];
    // 1. 所有 "15 天" → "14 天"
    sp.forEach(p => { if (p.days === '15 天') p.days = '14 天'; });
    // 2. 术后康复补 14 + 28
    if (l.slug === 'shuhou') {
      for (const p of shuhouAdds) {
        if (!sp.some(x => x.days === p.days)) sp.push(p);
      }
    }
    l.shortPlans = sp;
  }
  fs.writeFileSync(f, JSON.stringify(j, null, 2));
  console.log('OK', f);
  for (const [k, l] of Object.entries(lines)) {
    console.log(' ', l.slug, '→', (l.shortPlans||[]).map(p => p.days).join(', '));
  }
}
