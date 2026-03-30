const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scripts/parsed_namu.json', 'utf8'));
const finalEpisodes = [];

raw.forEach(row => {
    let id_string = row.sub_id;
    // If sub_id is empty or '-', fallback to dub_id if it exists
    if (!id_string || id_string === '-' || id_string.trim() === '') {
        id_string = row.dub_id;
    }
    
    let season = "";
    let episode = "";
    let isXFile = false;
    let xFileType = ""; // '대원', '애니박스', '투니버스'
    
    // For unreleased (미방영분), both might be '-'
    if (!id_string || id_string === '-' || id_string.trim() === '') {
        season = "미방영분";
        episode = row.japan_id.replace('화', '');
    } else {
        const match = id_string.match(/^([^-\s]+)-(.*)$/);
        if (match) {
            season = match[1];
            episode = match[2];
            
            if (season.startsWith("애X")) {
                isXFile = true;
                xFileType = "애니박스";
                season = season.replace("애", ""); // "X1"
            } else if (season.startsWith("대X")) {
                isXFile = true;
                xFileType = "대원방송";
                season = season.replace("대", ""); // "X1"
            } else if (season.startsWith("투X")) {
                isXFile = true;
                xFileType = "투니버스";
                season = season.replace("투", ""); // "X1"
            }
            else if (season.startsWith("X")) {
                isXFile = true;
                xFileType = "투니버스"; // default
            } else {
                // Regular numbers like '1', '2', '2021'
            }
        } else {
            season = "기타";
            episode = id_string;
        }
    }
    
    // Do NOT strip (전편), (후편) - keep original title
    let title = row.title.trim();

    finalEpisodes.push({
        japan_id: parseInt(row.japan_id.replace('화', '').replace('R', '')),
        season: season,
        isXFile: isXFile,
        xFileType: xFileType,
        episodeInSeason: parseInt(episode) || episode, // episode might be '-'
        originalIdString: id_string,
        title: title
    });
});

console.log(`Total broadcast episodes: ${finalEpisodes.length}`);
fs.writeFileSync('scripts/formatted_episodes.json', JSON.stringify(finalEpisodes, null, 2));
