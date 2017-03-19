const winston = require('winston');
const lang = require('lodash/lang');
const collection = require('lodash/collection');
const Table = require('./table');
const extractors = require('./extractors');

const { isNil } = lang;
const { every } = collection;
const {
  splitAndTrim,
  extractDiff,
  extractCompanyName,
  extractUrl,
  extractRemoteAvailable,
  extractLocations
} = extractors;

const addToTable = (addition) => {
  let [companyAndUrl, location, description] = splitAndTrim(addition, '|');
  let name = extractCompanyName(companyAndUrl);
  let url = extractUrl(companyAndUrl);
  let remoteOk = extractRemoteAvailable(location);
  let shouldProcess = every([name, url, location, description], Boolean);

  if (!shouldProcess) {
    return;
  }

  return extractLocations(location).then((locationRecords) => {
    let locations = locationRecords.map((r) => r.getId());
    let jobsTable = new Table('Jobs');

    return jobsTable.findOrCreateBy(`{Name} = "${name}"`, {
      'Name': name,
      'URL': url,
      'Cities': [...locations],
      'Remote OK?': remoteOk,
      'Process': description
    })
    .then((record) => winston.info(`OK: ${record.getId()} | ${record.get('Name')}`))
    .catch((err) => winston.error(err));
  });
}

const processDiff = (rawDiff = '') => {
  let extracted = extractDiff(rawDiff);

  if (isNil(extracted)) {
    winston.warn('Could not extract from diff');
    return;
  }

  return extracted.map(addToTable);
};

module.exports = processDiff;