async function testMobileOk(videoId) {
  const url = `https://m.ok.ru/videoembed/${videoId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    }
  });
  const html = await res.text();
  console.log("m.ok.ru HTML length:", html.length);
  const videoMatches = html.match(/https:\\\/\\\/[^"]+\.mp4/g) || html.match(/https:\/\/[^"]+\.mp4/g) || html.match(/https%3A%2F%2F[^"]+/g);
  console.log("Matches:", videoMatches ? videoMatches.slice(0, 5) : "NONE");
}

testMobileOk("2529320241838");
