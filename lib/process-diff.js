const Airtable = require('airtable');
const winston = require('winston');
const lang = require('lodash/lang');
const collection = require('lodash/collection');
const { isNil } = lang;
const { every } = collection;

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE);

const extractCompanyName = ((str = '') => {
  let [matched] = str.match(/\[(.*?)\]/g) || [];
  if (isNil(matched)) {
    return;
  }
  return matched.substring(1, matched.length - 1);
});

const extractUrl = ((str = '') => {
  let [matched] = str.match(/\((.*?)\)/g) || [];
  if (isNil(matched)) {
    return;
  }
  return matched.substring(1, matched.length - 1);
});

const extractDiff = ((parsedDiff) => {
  return parsedDiff[0]
    .chunks[0]
    .changes
    .filter((change) => change.type === 'add')
    .map((addition) => addition.content);
});

const processDiff = ((rawDiff = '') => {
  let extracted = extractDiff(rawDiff);

  if (isNil(extracted)) {
    winston.info('Could not extract from diff');
    return;
  }

  return extracted.map((addition) => {
    let [companyAndUrl, location, description] = addition
      .split('|')
      .map((s) => s.trim());
    let extractedCompany = extractCompanyName(companyAndUrl);
    let extractedUrl = extractUrl(companyAndUrl);
    let shouldProcess = every([extractedCompany, extractedUrl, location, description], Boolean);

    if (!shouldProcess) {
      return;
    }

    winston.info(`Adding ${extractedCompany} to Airtable`);
    base('Raw').create({
      Company: extractedCompany,
      URL: extractedUrl,
      Location: location,
      Description: description
    }, (err, record) => {
      if (err) { winston.error(err); return; }
      winston.info('Created:', record.getId());
    });
  });
});

module.exports = processDiff;