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
  let { content } = parsedDiff[0].chunks[0].changes.find((change) => change.type === 'add');
  if (isNil(content)) {
    return;
  }
  return content;
});

const processDiff = ((rawDiff = '') => {
  let extractedDiff = extractDiff(rawDiff);

  if (isNil(extractedDiff)) {
    winston.info('Could not extract from diff');
    return;
  }

  let [companyAndUrl, location, description] = extractedDiff
    .split('|')
    .map((s) => s.trim());
  let extractedCompany = extractCompanyName(companyAndUrl);
  let extractedUrl = extractUrl(companyAndUrl);
  let shouldProcess = every([extractedCompany, extractedUrl, location, description], Boolean);

  if (!shouldProcess) {
    return;
  }

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

module.exports = processDiff;