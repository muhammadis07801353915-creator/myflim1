/**
 * upload_to_r2.cjs
 * Uploads data.json to Cloudflare R2 using the Cloudflare API directly (no wrangler needed).
 *
 * Usage:
 *   CF_ACCOUNT_ID=xxx CF_R2_TOKEN=xxx node scripts/upload_to_r2.cjs
 *
 * OR set vars in a .env.r2 file:
 *   CF_ACCOUNT_ID=your_account_id
 *   CF_R2_TOKEN=your_r2_api_token
 *   R2_BUCKET=myflim
 */

const fs = require('fs');
const path = require('path');

// Try loading .env.r2 manually
const envFile = path.join(__dirname, '..', '.env.r2');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_R2_TOKEN   = process.env.CF_R2_TOKEN;
const R2_BUCKET     = process.env.R2_BUCKET || 'myflim';

if (!CF_ACCOUNT_ID || !CF_R2_TOKEN) {
  console.error('❌  Missing CF_ACCOUNT_ID or CF_R2_TOKEN');
  console.error('   Create a .env.r2 file in the project root with:');
  console.error('     CF_ACCOUNT_ID=your_account_id');
  console.error('     CF_R2_TOKEN=your_r2_api_token');
  console.error('     R2_BUCKET=myflim');
  process.exit(1);
}

const DATA_FILE = path.join(__dirname, '..', 'myflim-expo', 'r2_uploads', 'data.json');

if (!fs.existsSync(DATA_FILE)) {
  console.error('❌  data.json not found at:', DATA_FILE);
  console.error('   Run: node myflim-expo/scripts/generate_r2_data.cjs  first');
  process.exit(1);
}

async function uploadFile(localPath, r2Key) {
  const content = fs.readFileSync(localPath);
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${r2Key}`;
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CF_R2_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: content,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return text;
}

async function main() {
  const stat = fs.statSync(DATA_FILE);
  console.log(`📦  Uploading data.json (${(stat.size / 1024 / 1024).toFixed(2)} MB) → R2 bucket: ${R2_BUCKET}`);
  
  try {
    await uploadFile(DATA_FILE, 'data.json');
    console.log('✅  data.json uploaded successfully!');
    console.log(`    Public URL: https://pub-2e0fad43910745bf8310497add3ae5fe.r2.dev/data.json`);
  } catch (err) {
    console.error('❌  Upload failed:', err.message);
    process.exit(1);
  }
}

main();
