const fs = require('fs');
for (const f of ['data/site.json', 'initial-site.json']) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const home = (j.pages || []).find(p => p.id === 'p_home' || p.slug === 'home');
  if (!home) { console.log('no home in', f); continue; }
  const html = home.body_html;
  const before = '<div class="contact-head">\n        <p class="eyebrow-center"><span class="line"></span>联系我们<span class="line"></span></p>\n        <h2>不方便到店？<br/>线上也能快速了解方案</h2>\n      </div>\n      <div class="contact-box reveal">\n      <div class="contact-info">\n        <p class="contact-lead">';
  const after = '<div class="contact-head">\n        <p class="eyebrow-center"><span class="line"></span>联系我们<span class="line"></span></p>\n      </div>\n      <div class="contact-box reveal">\n      <div class="contact-info">\n        <h2>不方便到店？<br/>线上也能快速了解方案</h2>\n        <p class="contact-lead">';
  if (html.includes(before)) {
    home.body_html = html.replace(before, after);
    fs.writeFileSync(f, JSON.stringify(j, null, 2));
    console.log('OK', f);
  } else {
    console.log('NO MATCH', f);
  }
}
