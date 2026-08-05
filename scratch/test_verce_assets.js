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
  const main = await testUrl('https://www.myflim.com/');
  console.log('Main HTML status:', main.statusCode);

  const scriptRegex = /src="([^"]+)"/g;
  let match;
  const scripts = [];
  while ((match = scriptRegex.exec(main.body)) !== null) {
    if (match[1].includes('_next')) {
      scripts.push(match[1]);
    }
  }

  console.log(`Found ${scripts.length} script tags.`);
  let allSuccess = true;
  for (const s of scripts) {
    const fullUrl = s.startsWith('http') ? s : `https://www.myflim.com${s}`;
    const res = await testUrl(fullUrl);
    if (res.statusCode !== 200) {
      console.error(`FAIL: ${s} returned ${res.statusCode}`);
      allSuccess = false;
    }
  }

  if (allSuccess) {
    console.log('SUCCESS: All Next.js script bundles loaded with 200 OK!');
  }
}

run();
