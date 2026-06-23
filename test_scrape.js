const https = require('https');
https.get('https://t.me/s/iraqborsa', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const regex = /<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    let lastMsg = '';
    while((match = regex.exec(data)) !== null) {
      lastMsg = match[1];
    }
    console.log("LAST MESSAGE:");
    console.log(lastMsg);
  });
});
