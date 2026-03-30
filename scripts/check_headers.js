const fs = require('fs');
const html = fs.readFileSync('scripts/namu_test.html', 'utf8');
const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
let match;
while ((match = trRegex.exec(html)) !== null) {
  if (match[1].includes('더빙') && match[1].includes('자막')) {
     console.log("Found header row:", match[1].replace(/<[^>]+>/g, '|').replace(/\|+/g, '|'));
  }
}
