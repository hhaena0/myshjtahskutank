const fs = require('fs');
const html = fs.readFileSync('scripts/namu_test.html', 'utf8');

const tableMatcher = /<table[^>]*>([\s\S]*?)<\/table>/g;
let tableMatch;
const allEpisodes = [];

while ((tableMatch = tableMatcher.exec(html)) !== null) {
    const tableHtml = tableMatch[1];
    
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    let trMatch;
    
    const grid = [];
    let r = 0;
    
    while ((trMatch = trRegex.exec(tableHtml)) !== null) {
        const rowHtml = trMatch[1];
        if (!grid[r]) grid[r] = [];
        let c = 0;
        
        const tdRegex = /<(td|th)([^>]*)>([\s\S]*?)<\/\1>/g;
        let tdMatch;
        while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
            const attr = tdMatch[2];
            let content = tdMatch[3].replace(/<[^>]+>/g, '').trim();
            content = content.replace(/&#91;/g, '[').replace(/&#93;/g, ']').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
            
            const colspanMatch = attr.match(/colspan=['"]?(\d+)['"]?/);
            const rowspanMatch = attr.match(/rowspan=['"]?(\d+)['"]?/);
            const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;
            const rowspan = rowspanMatch ? parseInt(rowspanMatch[1]) : 1;
            
            // Advance `c` if cell is occupied by previous rowspan
            while (grid[r][c] !== undefined) c++;
            
            for (let rr = 0; rr < rowspan; rr++) {
                for (let cc = 0; cc < colspan; cc++) {
                    if (!grid[r + rr]) grid[r + rr] = [];
                    grid[r + rr][c + cc] = content;
                }
            }
            c += colspan;
        }
        r++;
    }
    
    // Now we have the grid for this table.
    // Try to find if this table has '화수' / '자막' / '더빙' / '제목'
    if (grid.length === 0) continue;
    
    // Find column indices
    let colId = -1, colDub = -1, colSub = -1, colTitle = -1;
    // Scan the first few rows for headers
    for (let r = 0; r < Math.min(5, grid.length); r++) {
        for (let c = 0; c < grid[r].length; c++) {
            const val = grid[r][c];
            if (val.includes('화수')) colId = c;
            else if (val.includes('더빙')) colDub = c;
            else if (val.includes('자막')) colSub = c;
            else if (val.includes('제목')) colTitle = c;
        }
    }
    
    if (colId !== -1 && colDub !== -1 && colSub !== -1 && colTitle !== -1) {
        // Parse rows
        for (let r = 0; r < grid.length; r++) {
            const row = grid[r];
            if (!row[colId]) continue;
            
            const idVal = row[colId].replace(/화$/, '').trim();
            // is it a valid episode row? (number or R+number)
            if (/^R?\d+(-\d+)?$/.test(idVal)) {
                 allEpisodes.push({
                     japan_id: idVal + "화",
                     dub_id: row[colDub],
                     sub_id: row[colSub],
                     title: row[colTitle]
                 });
            }
        }
    }
}

// Remove duplicates if any (due to our loose filtering maybe)
const uniqueEps = [];
const seen = new Set();
allEpisodes.forEach(ep => {
    if(!seen.has(ep.japan_id)) {
        seen.add(ep.japan_id);
        uniqueEps.push(ep);
    }
});

console.log("Episodes parsed with Grid Builder:", uniqueEps.length);
fs.writeFileSync('scripts/parsed_namu.json', JSON.stringify(uniqueEps, null, 2));
console.log("Test: 971 =>", uniqueEps.find(e => e.japan_id.includes('971')));
console.log("Test: 891 =>", uniqueEps.find(e => e.japan_id.includes('891')));
console.log("Test: 892 =>", uniqueEps.find(e => e.japan_id.includes('892')));
