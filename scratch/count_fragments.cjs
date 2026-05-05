const fs = require('fs');
const code = fs.readFileSync('src/admin/pages/Movies.tsx', 'utf8');
const lines = code.split('\n');

// Count JSX fragments
let opens = 0, closes = 0;
let firstOpenLine = -1;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Count <> fragments (not in strings or comments)
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
  
  // Count standalone <> and </>
  const openMatches = line.match(/<>(?![^<]*\/>)/g);
  const closeMatches = line.match(/<\/>/g);
  
  if (openMatches) {
    opens += openMatches.length;
    if (firstOpenLine === -1) firstOpenLine = i + 1;
    console.log(`  OPEN  at line ${i+1}: ${line.trim()}`);
  }
  if (closeMatches) {
    closes += closeMatches.length;
    console.log(`  CLOSE at line ${i+1}: ${line.trim()}`);
  }
}
console.log(`\nTotal <> opens: ${opens}, closes: ${closes}, balance: ${opens - closes}`);
console.log(`First open at line: ${firstOpenLine}`);
