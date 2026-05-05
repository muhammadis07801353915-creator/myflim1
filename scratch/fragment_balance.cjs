const fs = require('fs');
const code = fs.readFileSync('src/admin/pages/Movies.tsx', 'utf8');

const lines = code.split('\n');
let balance = 0;
let startLine = 1348;

for (let i = startLine - 1; i < lines.length; i++) {
  const line = lines[i];
  // Simple check for <> and </>
  const opens = line.split('<>').length - 1;
  const closes = line.split('</>').length - 1;
  balance += opens;
  balance -= closes;
  
  if (balance === 0 && i > startLine) {
    console.log('Fragment balance reached 0 at line:', i + 1);
    // break; // Don't break to see if it goes below 0
  }
}
console.log('Final Fragment balance:', balance);
