const fs = require('fs');
const html = fs.readFileSync('scripts/namu_test.html', 'utf8');
const searchString = '표적은 경시청';
let idx = html.indexOf(searchString);
if (idx !== -1) {
    console.log(html.substring(Math.max(0, idx - 500), idx + 200));
} else {
    console.log("Not found.");
}
