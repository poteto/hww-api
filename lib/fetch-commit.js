const fetch = require('node-fetch');
const parseDiff = require('parse-diff');

const fetchCommit = (url, processorFn) => {
  console.log('Fetching commit', url);
  fetch(url, { headers: { Accept: 'application/vnd.github.diff' } })
  .then((res) => res.text())
  .then((rawDiff) => {
    let files = parseDiff(rawDiff);
    let { content } = files[0].chunks[0].changes.find((change) => change.type === 'add');
    processorFn(content);
  })
  .catch(err => console.error(err));
};

module.exports = fetchCommit;