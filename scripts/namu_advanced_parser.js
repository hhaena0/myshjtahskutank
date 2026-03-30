const fs = require('fs');
const html = fs.readFileSync('scripts/namu_test.html', 'utf8');

const rows = [];
const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
let trMatch;

while ((trMatch = trRegex.exec(html)) !== null) {
  const rowHtml = trMatch[1];
  const tds = [];
  const tdRegex = /<(td|th)([^>]*)>([\s\S]*?)<\/\1>/g;
  let tdMatch;
  
  while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
    const attr = tdMatch[2];
    let content = tdMatch[3].replace(/<[^>]+>/g, '').trim();
    // Decode HTML entities
    content = content.replace(/&#91;/g, '[').replace(/&#93;/g, ']').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
    
    // Check colspan
    const colspanMatch = attr.match(/colspan=['"]?(\d+)['"]?/);
    const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;
    
    for(let i=0; i<colspan; i++) {
        tds.push(content);
    }
  }
  
  // Is this an episode row? (First col ends with '화' and it's a number ending in 화 like 10화, or 1화)
  if (tds.length >= 4 && /^R?\d+(-\d+)?화?$/.test(tds[0].trim().replace(/화$/, ''))) {
    rows.push(tds);
  }
}

console.log("Total rows parsed:", rows.length);
// Write to JSON
const episodes = rows.map((r) => {
    return {
        japan_id: r[0],
        dub_id: r[1],
        sub_id: r[2],
        title: r[3]
    };
});
fs.writeFileSync('scripts/parsed_namu.json', JSON.stringify(episodes, null, 2));
console.log("Saved scripts/parsed_namu.json");
