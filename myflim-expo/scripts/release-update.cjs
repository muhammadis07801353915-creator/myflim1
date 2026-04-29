#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function usage() {
  console.log(`
Usage:
  node scripts/release-update.cjs --version 1.0.3 --build 5 --apk-url "https://...apk" --notes "Bug fixes" [--mandatory true]

Options:
  --version     Required. App version (ex: 1.0.3)
  --build       Required. Android versionCode/build number (ex: 5)
  --apk-url     Required. Direct download URL to apk
  --notes       Optional. Release notes text
  --mandatory   Optional. true/false (default false)

Environment (optional for direct insert):
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

If SUPABASE_SERVICE_ROLE_KEY is missing, the script prints SQL for manual paste.
`);
}

function toBool(v, fallback = false) {
  if (typeof v !== 'string') return fallback;
  return ['1', 'true', 'yes', 'y'].includes(v.toLowerCase());
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.version || !args.build || !args['apk-url']) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const root = process.cwd();
  const appJsonPath = path.join(root, 'app.json');
  if (!fs.existsSync(appJsonPath)) {
    throw new Error(`app.json not found at ${appJsonPath}`);
  }

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  if (!appJson.expo || !appJson.expo.android) {
    throw new Error('app.json is missing expo/android fields');
  }

  appJson.expo.version = args.version;
  appJson.expo.android.versionCode = Number(args.build);
  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

  const payload = {
    platform: 'android',
    version: args.version,
    build_version: String(args.build),
    apk_url: args['apk-url'],
    release_notes: args.notes || null,
    mandatory: toBool(args.mandatory, false),
  };

  const supabaseUrl = process.env.SUPABASE_URL || 'https://xzvojposgvdjwriivryp.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.log('Updated app.json version/build successfully.');
    console.log('\nNo SUPABASE_SERVICE_ROLE_KEY found. Run this SQL manually:\n');
    console.log(`insert into public.app_updates (platform, version, build_version, apk_url, release_notes, mandatory)
values (
  'android',
  '${payload.version}',
  '${payload.build_version}',
  '${payload.apk_url.replace(/'/g, "''")}',
  ${payload.release_notes ? `'${payload.release_notes.replace(/'/g, "''")}'` : 'null'},
  ${payload.mandatory ? 'true' : 'false'}
);`);
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from('app_updates').insert(payload);
  if (error) throw error;

  console.log('Updated app.json and inserted new app_updates row successfully.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
