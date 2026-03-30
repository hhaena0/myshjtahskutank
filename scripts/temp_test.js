const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\nick\\.gemini\\antigravity\\brain\\78d486ce-2c51-4b5f-a8d9-8b4da9c52155\\.system_generated\\steps\\100\\content.md', 'utf8');
const lines = content.split('\n');

const patterns = [
  /3\.2\.19/, /3\.2\.20/, /3\.2\.21/, /3\.2\.22/, /3\.2\.23/, /3\.2\.24/, /3\.2\.25/, /3\.3\.1/, /3\.3\.2/
];

for(let i=0; i<lines.length; i++) {
  const line = lines[i];
  if(patterns.some(p => p.test(line)) && line.includes('section=')) {
    console.log(`\n--- Line ${i+1}: ${line}`);
    // print next 10 lines
    for(let j=1; j<=15; j++) {
      if(i+j < lines.length) console.log(`${i+1+j}: ${lines[i+j]}`);
    }
  }
}
