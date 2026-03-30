const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'namu.wiki',
  port: 443,
  path: encodeURI('/w/명탐정 코난(애니메이션)/회차 목록'),
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('C:\\Users\\nick\\Documents\\해나\\뀨\\P1\\scripts\\namu_test.html', data);
    console.log('Saved to namu_test.html, length: ' + data.length);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
