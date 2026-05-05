const fs = require('fs');
const code = fs.readFileSync('src/admin/pages/Movies.tsx', 'utf8');
const lines = code.split('\n');

// Count curly braces from line 548 to track function body balance
let balance = 0;
// Find start of function - look for 'export default function Movies'
let funcStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export default function Movies')) {
    funcStart = i;
    break;
  }
}
console.log('Function starts at line:', funcStart + 1);

// Track brace balance from function start
for (let i = funcStart; i < lines.length; i++) {
  const line = lines[i];
  // Skip JSX string contexts roughly
  for (const char of line) {
    if (char === '{') balance++;
    if (char === '}') balance--;
  }
  if (balance === 0 && i > funcStart + 10) {
    console.log(`Function brace balance reaches 0 at line ${i + 1}: "${lines[i].trim()}"`);
    console.log('Remaining lines after this:', lines.length - i - 1);
    break;
  }
}
console.log('Final balance:', balance);
console.log('Total lines:', lines.length);
