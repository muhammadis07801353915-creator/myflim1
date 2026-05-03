const fetch = require('node-fetch');

const TMDB_API_KEY = 'c2607383b5fe48c445465d4e8b1ded29';
const tvId = '11964'; // Jumong

async function testJumong() {
    try {
        const resp = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}`);
        const details = await resp.json();
        console.log('TV Show:', details.name);
        console.log('Seasons count:', details.seasons.length);
        
        let allEpisodes = [];
        for (const season of details.seasons) {
            if (season.season_number === 0) continue;
            console.log(`Fetching Season ${season.season_number}...`);
            const sResp = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`);
            const sDetails = await sResp.json();
            if (sDetails.episodes) {
                console.log(`Season ${season.season_number} has ${sDetails.episodes.length} episodes.`);
                allEpisodes = [...allEpisodes, ...sDetails.episodes];
            }
        }
        console.log('Total episodes found:', allEpisodes.length);
    } catch (e) {
        console.error(e);
    }
}

testJumong();
