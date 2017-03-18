const fetch = require('node-fetch');
const parseDiff = require('parse-diff');
const winston = require('winston');
const lang = require('lodash/lang');
const { isNil } = lang;

const fetchCommit = ((url) => {
  if (isNil(url)) { return; }
  winston.info(`Fetching commit ${url}`);
  return fetch(url, { headers: { Accept: 'application/vnd.github.diff' } })
    .then((res) => res.text())
    .then((rawDiff) => parseDiff(rawDiff))
    .catch((err) => winston.error(err));
});

module.exports = fetchCommit;