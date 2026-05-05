const fs = require('fs');
const code = fs.readFileSync('src/admin/pages/Movies.tsx', 'utf8');

function count(char) {
  return code.split(char).length - 1;
}

console.log('Total length:', code.length);
console.log('{ count:', count('{'));
console.log('} count:', count('}'));
console.log('( count:', count('('));
console.log(') count:', count(')'));
console.log('< count:', count('<'));
console.log('> count:', count('>'));
console.log('<> count:', count('<>'));
console.log('</> count:', count('</>'));
