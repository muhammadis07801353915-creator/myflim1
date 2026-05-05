const fs = require('fs');
const code = fs.readFileSync('src/admin/pages/Movies.tsx', 'utf8');
const lines = code.split('\n');

// Look for the ternary structure
for (let i = 545; i <= 555; i++) {
  console.log(`${i+1}: "${lines[i]}"`);
}
console.log('...');

// Look around 1240-1250
for (let i = 1238; i <= 1248; i++) {
  console.log(`${i+1}: "${lines[i]}"`);
}
console.log('...');

// Look around 1448-1455
for (let i = 1448; i <= 1455; i++) {
  console.log(`${i+1}: "${lines[i]}"`);
}
