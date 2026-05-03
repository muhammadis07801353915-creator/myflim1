const fetch = require('node-fetch');
const TMDB_API_KEY = 'c2607383b5fe48c445465d4e8b1ded29';
const id = '726137';

async function check() {
    let resp = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}`);
    let data = await resp.json();
    console.log('Movie:', data.title || data.name);
    
    resp = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}`);
    data = await resp.json();
    console.log('TV:', data.name || data.title);
}
check();
