const fs = require('fs');

const html = fs.readFileSync('scripts/namu_test.html', 'utf8');

// Find the title "제트 코스터 살인사건"
let idx = html.indexOf('제트 코스터 살인사건');
// We want to find the first <tr> block that contains this to see the columns

let startIdx = html.lastIndexOf('<tr', idx);
let endIdx = html.indexOf('</tr>', idx) + 5;

// Let's get the next 10 rows from here to understand colspan logic
for(let i=0; i<10; i++) {
   const rowHtml = html.substring(startIdx, endIdx);
   
   // super basic td extraction
   const tds = [];
   const tdRegex = /<td[^>]*>(.*?)<\/td>/g;
   let match;
   while ((match = tdRegex.exec(rowHtml)) !== null) {
     // remove all html tags from td
     let text = match[1].replace(/<[^>]+>/g, '').trim();
     tds.push(text);
   }

   console.log(`Row ${i+1}:`, tds);

   startIdx = html.indexOf('<tr', endIdx);
   if(startIdx === -1) break;
   endIdx = html.indexOf('</tr>', startIdx) + 5;
}
