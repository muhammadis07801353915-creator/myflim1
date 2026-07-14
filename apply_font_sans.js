const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = [...walk('app'), ...walk('src')];
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Add font-sans to existing classNames in <Text ... className="...">
  content = content.replace(/<Text([^>]*?)className=(["'])([^"']*?)\2([^>]*?)>/g, (match, before, quote, classNames, after) => {
    // If it already has font-sans or a specific font family class, don't add
    if (/\b(font-sans|font-serif|font-mono)\b/.test(classNames)) {
      return match;
    }
    return `<Text${before}className=${quote}${classNames} font-sans${quote}${after}>`;
  });

  // 2. Add className="font-sans" to <Text> tags that don't have className
  content = content.replace(/<Text((?!className=)[^>]*?)>/g, (match, attrs) => {
    // avoid matching </Text> or <TextInput
    if (match.startsWith('</')) return match;
    // ensure it's not actually <TextInput> 
    if (match.startsWith('<TextInput')) {
        if (!match.includes('className=')) {
            return `<TextInput${attrs} className="font-sans">`;
        }
        return match;
    }
    return `<Text${attrs} className="font-sans">`;
  });
  
  // 3. Same for TextInput with existing className
  content = content.replace(/<TextInput([^>]*?)className=(["'])([^"']*?)\2([^>]*?)>/g, (match, before, quote, classNames, after) => {
    if (/\b(font-sans|font-serif|font-mono)\b/.test(classNames)) {
      return match;
    }
    return `<TextInput${before}className=${quote}${classNames} font-sans${quote}${after}>`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
  }
});

console.log(`Added font-sans to ${modifiedCount} files.`);
