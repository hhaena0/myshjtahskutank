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

fetchPage(1).then(data => {
  console.log('Page 1 fetched');
  console.log('Total pages:', data.pagination.last_visible_page);
  console.log('Sample episode 1 filler status:', data.data[0].filler);
}).catch(console.error);
