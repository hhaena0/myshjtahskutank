const fs = require('fs');
const https = require('https');

const fetchPage = (page) => {
  return new Promise((resolve, reject) => {
    https.get(`https://api.jikan.moe/v4/anime/235/episodes?page=${page}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const fillers = new Set();
  
  console.log("Fetching Jikan API to find filler episodes...");
  for (let i = 1; i <= 15; i++) {
    try {
      const data = await fetchPage(i);
      if (!data || !data.data || data.data.length === 0) break;
      data.data.forEach(ep => {
        if (ep.filler) fillers.add(ep.mal_id);
      });
      console.log(`Page ${i} fetched. Total fillers found so far: ${fillers.size}`);
      await delay(500); 
    } catch(e) {
      console.error(e);
      break;
    }
  }

  const ourEps = JSON.parse(fs.readFileSync('scripts/formatted_episodes.json', 'utf8'));
  
  ourEps.forEach(ep => {
      ep.isOriginal = fillers.has(ep.japan_id);
  });
  
  const output = {
      seasons: [],
      totalEpisodes: ourEps.length,
      generatedAt: new Date().toISOString()
  };

  const seasonMap = {};

  ourEps.forEach(ep => {
      let sName;
      let sId;
      
      if (ep.season === "미방영분" || ep.season === "기타" || ep.season.includes("특별편")) {
          sName = "기타";
          sId = "other";
      } else if (ep.isXFile) {
          const sNum = (ep.season || "").replace('X', '');
          sName = `X 시즌${sNum}`;
          sId = `x-${sNum}`; // We don't differentiate by network in the ID to merge X files of same season
      } else {
          // "1", "2"... "2021"
          sName = `시즌${ep.season}`;
          sId = `sub-${ep.season}`;
      }
                    
      if (!seasonMap[sId]) {
          seasonMap[sId] = {
              seasonId: sId,
              seasonName: sName,
              seasonNumber: isNaN(ep.season) ? 0 : parseInt(ep.season),
              isXFile: ep.isXFile,
              episodes: []
          };
          output.seasons.push(seasonMap[sId]);
      }

      seasonMap[sId].episodes.push({
          episodeInSeason: ep.episodeInSeason,
          title: ep.title,
          japan_id: ep.japan_id,
          originalIdString: ep.originalIdString,
          isOriginal: ep.isOriginal
      });
  });
  
  // Sort seasons reasonably
  output.seasons.sort((a, b) => {
      if (a.seasonId === "other") return 1;
      if (b.seasonId === "other") return -1;
      
      if (a.isXFile !== b.isXFile) return a.isXFile ? 1 : -1;
      return a.seasonNumber - b.seasonNumber;
  });

  const finalStr = JSON.stringify(output, null, 2);
  const dataPath = 'C:\\Users\\nick\\Documents\\해나\\뀨\\P1\\data\\korean_episodes.json';
  fs.writeFileSync(dataPath, finalStr);
  console.log(`Saved successfully to ${dataPath}. Total episodes: ${ourEps.length}. Filler count: ${fillers.size}`);
}

main();
