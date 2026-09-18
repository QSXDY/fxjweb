const fs = require('fs');
for (const f of ['data/site.json', 'initial-site.json']) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const l of Object.values(j.settings.planLines || {})) {
    for (const p of l.shortPlans || []) {
      if (p.desc) p.desc = p.desc.replace(/15\s*天/g, p.days || '');
    }
  }
  fs.writeFileSync(f, JSON.stringify(j, null, 2));
}
console.log('done');
// 打印检查
const j = JSON.parse(fs.readFileSync('data/site.json', 'utf8'));
for (const l of Object.values(j.settings.planLines || {})) {
  for (const p of l.shortPlans || []) console.log(l.slug, '|', p.days, '|', p.desc);
}
