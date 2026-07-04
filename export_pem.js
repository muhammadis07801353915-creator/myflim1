const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Find the keystore file
const keystoreFile = fs.readdirSync('.').find(f => f.endsWith('.jks'));
if (!keystoreFile) {
  console.error('No .jks file found in current directory!');
  process.exit(1);
}

console.log('Found keystore:', keystoreFile);

// Try to find keytool in common Node.js related paths
const possiblePaths = [
  'C:\\Program Files\\Microsoft\\jdk-17.0.13.11-hotspot\\bin\\keytool.exe',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.13.11-hotspot\\bin\\keytool.exe',
  'C:\\Program Files\\Java\\jdk-17\\bin\\keytool.exe',
  'C:\\Program Files\\Java\\jdk-21\\bin\\keytool.exe',
  'C:\\Program Files\\Java\\jdk1.8.0_301\\bin\\keytool.exe',
];

let keytoolPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    keytoolPath = p;
    break;
  }
}

// Try searching
try {
  const result = execSync('where.exe keytool', { encoding: 'utf8' }).trim();
  if (result) keytoolPath = result.split('\n')[0].trim();
} catch {}

if (!keytoolPath) {
  // Try android SDK
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || 
    path.join(process.env.LOCALAPPDATA || '', 'Android\\Sdk');
  const jdkInSdk = path.join(androidHome, 'jdk\\bin\\keytool.exe');
  if (fs.existsSync(jdkInSdk)) keytoolPath = jdkInSdk;
}

if (!keytoolPath) {
  console.log('\nkeytool not found. Please install Java JDK or use the info below:');
  console.log('\nYour keystore details for the developer:');
  console.log('Keystore file:', keystoreFile);
  console.log('Key Alias: d1c820304149ce318c1e128201f31ed9');
  console.log('Keystore password: 449674193d1b8fe55213b1c8d515793b');
  console.log('Key password: 36d995b4bd06604a7d1496285b5d35f4');
  process.exit(0);
}

console.log('Using keytool at:', keytoolPath);

const cmd = `"${keytoolPath}" -export -rfc -keystore "${keystoreFile}" -alias d1c820304149ce318c1e128201f31ed9 -file upload_certificate.pem -storepass 449674193d1b8fe55213b1c8d515793b -keypass 36d995b4bd06604a7d1496285b5d35f4`;

try {
  execSync(cmd, { encoding: 'utf8', stdio: 'inherit' });
  console.log('\nSuccess! File saved as: upload_certificate.pem');
} catch (e) {
  console.error('Error:', e.message);
}
