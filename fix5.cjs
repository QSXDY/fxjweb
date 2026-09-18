const fs = require('fs');
const newPlan = {
  "days": "15 天",
  "name": "全周期调理",
  "tag": "完整月经周期",
  "desc": "覆盖一个完整月经周期，系统调理备孕体质",
  "points": [
    "经后期·排卵期·经前期分型食谱",
    "专属营养师一对一体质跟进",
    "费用可抵扣升级长期套餐"
  ]
};
for (const f of ['data/site.json', 'initial-site.json']) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const lines = j.settings.planLines;
  for (const k of Object.keys(lines)) {
    if (lines[k].slug === 'beiyun') {
      const sp = lines[k].shortPlans || [];
      if (!sp.some(p => p.days === '15 天')) {
        sp.push(newPlan);
        lines[k].shortPlans = sp;
        fs.writeFileSync(f, JSON.stringify(j, null, 2));
        console.log('OK', f, '→', sp.map(p => p.days).join(', '));
      } else {
        console.log('EXISTS', f);
      }
    }
  }
}
