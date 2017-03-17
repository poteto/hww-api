const fetch = require('node-fetch');
const parseDiff = require('parse-diff');
const lang = require('lodash/lang');
const { isNil } = lang;

const fetchCommit = (url, processorFn) => {
  console.log('Fetching commit', url);
  fetch(url, { headers: { Accept: 'application/vnd.github.diff' } })
  .then((res) => res.text())
  .then((rawDiff) => {
    let files = parseDiff(rawDiff);
    let { content } = files[0].chunks[0].changes.find((change) => change.type === 'add');

    if (!isNil(content)) {
      processorFn(content);
    }
  })
  .catch(err => console.error(err));
};

module.exports = fetchCommit;