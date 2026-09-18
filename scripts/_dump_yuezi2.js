'use strict';
const http = require('http');
http.get({ host: 'localhost', port: 3000, path: '/yuezi' }, function (res) {
  let s = '';
  res.setEncoding('utf8');
  res.on('data', function (c) { s += c; });
  res.on('end', function () {
    function seg(name) {
      const i = s.indexOf('class="' + name);
      if (i === -1) return 'NOT FOUND at all';
      const end = s.indexOf('</section>', i);
      return s.slice(i, end > -1 ? end + 10 : i + 800);
    }
    console.log('=== STAGES ===');
    console.log(seg('stages').slice(0, 2000));
    console.log('\n=== CONTACT ===');
    console.log(seg('contact').slice(0, 1600));
  });
});
