const fs = require('fs');

const html = fs.readFileSync('scripts/namu_test.html', 'utf8');
const rows = [];
let dubIndex = 1;
let subIndex = 2;
// Use a 2D array buffer to handle rowspan
// rowSpans[rowIdx][colIdx] = "value"
const rowSpans = {}; 

const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
let trMatch;
let rowIdx = 0;

while ((trMatch = trRegex.exec(html)) !== null) {
  const rowHtml = trMatch[1];
  
  // Check header row for swapped dub/sub
  if (rowHtml.includes('<th') && rowHtml.includes('자막') && rowHtml.includes('더빙')) {
      // Find order
      const ths = [];
      const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/g;
      let thMatch;
      while ((thMatch = thRegex.exec(rowHtml)) !== null) {
          ths.push(thMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      
      const d = ths.indexOf('더빙');
      const s = ths.indexOf('자막');
      // If found in this TR
      if (d !== -1 && s !== -1) {
          dubIndex = d;
          subIndex = s;
      }
  }

  const tds = [];
  const tdRegex = /<(td|th)([^>]*)>([\s\S]*?)<\/\1>/g;
  let tdMatch;
  let rawColIdx = 0;
  
  while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
    const attr = tdMatch[2];
    let content = tdMatch[3].replace(/<[^>]+>/g, '').trim();
    content = content.replace(/&#91;/g, '[').replace(/&#93;/g, ']').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
    
    const colspanMatch = attr.match(/colspan=['"]?(\d+)['"]?/);
    const rowspanMatch = attr.match(/rowspan=['"]?(\d+)['"]?/);
    const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;
    const rowspan = rowspanMatch ? parseInt(rowspanMatch[1]) : 1;
    
    for (let c = 0; c < colspan; c++) {
        // Find next empty spot avoiding rowSpans
        while (rowSpans[rowIdx] && rowSpans[rowIdx][rawColIdx] !== undefined) {
             tds.push(rowSpans[rowIdx][rawColIdx]);
             rawColIdx++;
        }
        
        // Push content
        tds.push(content);
        
        // Set rowSpans for FUTURE rows
        for (let r = 1; r < rowspan; r++) {
            if (!rowSpans[rowIdx + r]) rowSpans[rowIdx + r] = [];
            rowSpans[rowIdx + r][rawColIdx] = content;
        }
        rawColIdx++;
    }
  }
  
  // Process remaining rowSpans for this row
  while (rowSpans[rowIdx] && rowSpans[rowIdx][rawColIdx] !== undefined) {
      tds.push(rowSpans[rowIdx][rawColIdx]);
      rawColIdx++;
  }

  if (tds.length >= 4 && /^R?\d+(-\d+)?화?$/.test(tds[0].trim().replace(/화$/, ''))) {
    rows.push({
        japan_id: tds[0],
        dub_id: tds[dubIndex],
        sub_id: tds[subIndex],
        title: tds[subIndex === 1 && dubIndex === 2 ? 3 : 3] // title is usually 3 if sub is 1, dub is 2 (index 1 and 2), meaning Japan is 0, Dub 1, Sub 2, Title 3. Wait, if Japan is 0, Sub is 1, Dub is 2, Title might be 3! Yes.
    });
  }
  
  rowIdx++;
}

console.log("Parsed rows:", rows.length);
fs.writeFileSync('scripts/parsed_namu.json', JSON.stringify(rows, null, 2));
