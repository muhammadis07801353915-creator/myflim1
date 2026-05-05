const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const Parser = acorn.Parser.extend(jsx());

const code = fs.readFileSync('src/admin/pages/Movies.tsx', 'utf8');

try {
  Parser.parse(code, {
    sourceType: 'module',
    ecmaVersion: 2020
  });
  console.log('No syntax errors found!');
} catch (err) {
  console.error('Syntax error found:');
  console.error(err.message);
  console.error('At line:', err.loc.line, 'column:', err.loc.column);
  
  const lines = code.split('\n');
  const errorLine = lines[err.loc.line - 1];
  console.error('Line content:', errorLine);
}
