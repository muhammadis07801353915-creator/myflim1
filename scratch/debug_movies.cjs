const fs = require('fs');
const code = fs.readFileSync('src/admin/pages/Movies.tsx', 'utf8');
const lines = code.split('\n');

// Print lines 1240 to 1260 (form->list transition)
console.log('=== FORM->LIST TRANSITION (1240-1260) ===');
for (let i = 1239; i <= 1259; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// Print lines 1440 to 1460 (list end / ternary close)
console.log('\n=== LIST END / TERNARY CLOSE (1440-1460) ===');
for (let i = 1439; i <= 1459; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}

// Print lines 1660 to end
console.log('\n=== FILE END ===');
for (let i = 1659; i < lines.length; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
