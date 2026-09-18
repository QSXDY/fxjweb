const fs = require('fs');
for (const f of ['data/site.json', 'initial-site.json']) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const lines = j.settings.planLines;
  for (const [k, l] of Object.entries(lines)) {
    if (l.slug === 'yuezi') {
      l.shortPlans = (l.shortPlans || []).filter(p => p.days !== '15 天' && p.days !== '30 天');
      console.log('yuezi →', l.shortPlans.map(p => p.days).join(', '));
    }
  }
  fs.writeFileSync(f, JSON.stringify(j, null, 2));
}
