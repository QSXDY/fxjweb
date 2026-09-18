/* 提取 yuezi 页关键区块原始 HTML */
'use strict';
const http = require('http');
http.get({ host: 'localhost', port: 3000, path: '/yuezi' }, function (res) {
  let s = '';
  res.setEncoding('utf8');
  res.on('data', function (c) { s += c; });
  res.on('end', function () {
    // trustbar
    let m = s.match(/<section class="[^"]*trustbar[^"]*">[\s\S]*?<\/section>/);
    console.log('=== TRUSTBAR ===');
    console.log(m ? m[0].slice(0, 1500) : 'NOT FOUND');
    // stages
    m = s.match(/<section class="[^"]*stages[^"]*">[\s\S]*?<\/section>/);
    console.log('\n=== STAGES ===');
    console.log(m ? m[0].slice(0, 1800) : 'NOT FOUND');
    // contact
    m = s.match(/<section class="[^"]*contact[^"]*">[\s\S]*?<\/section>/);
    console.log('\n=== CONTACT ===');
    console.log(m ? m[0].slice(0, 1500) : 'NOT FOUND');
    // plans 第一张卡
    m = s.match(/<article class="plan-card[\s\S]*?<\/article>/);
    console.log('\n=== PLANCARD 1 ===');
    console.log(m ? m[0].slice(0, 1200) : 'NOT FOUND');
  });
});
