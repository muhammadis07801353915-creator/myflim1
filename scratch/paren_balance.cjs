const fs = require('fs');
const code = fs.readFileSync('src/admin/pages/Movies.tsx', 'utf8');

const lines = code.split('\n');
let balance = 0;
let startLine = 1348;

for (let i = startLine - 1; i < lines.length; i++) {
  const line = lines[i];
  for (let char of line) {
    if (char === '(') balance++;
    if (char === ')') balance--;
  }
  if (balance === 0 && i > startLine) {
    console.log('Balance reached 0 at line:', i + 1);
    break;
  }
}
console.log('Final balance:', balance);
