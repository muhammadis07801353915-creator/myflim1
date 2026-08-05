import https from 'https';

function testUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

async function run() {
  const url = 'https://www.myflim.com/_next/static/chunks/0cje14_narrpx.js';
  console.log('Testing JS chunk URL:', url);
  const res = await testUrl(url);
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
}

run();
