const winston = require('winston');
const lang = require('lodash/lang');
const collection = require('lodash/collection');
const lookupLocation = require('./lookup-location');
const Table = require('./table');

const { isNil } = lang;
const { every } = collection;

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

const extractLocation = ((location) => {
  let locations = location
    .split(/[;\/\&]/g)
    .map((s) => s.trim());
  winston.info(`Parsed locations: ${locations}`);
  return locations
    .map((location) => {
      return lookupLocation(location)
      .then((result) => {
        let { city, country } = result;
        return findOrCreateCity(city.long_name, country.long_name);
      });
  });
});

const findOrCreateCity = ((cityName, countryName) => {
  let citiesTable = new Table('Cities');
  let countriesTable = new Table('Countries');

  return countriesTable
    .where(`{Name} = "${countryName}"`)
    .then(([record]) => {
      if (isNil(record)) {
        return Promise.reject(`Could not find country ${countryName}, skipping create city ${cityName}`);
      }
      winston.info(`Found country ${countryName}`);
      return record.getId();
    })
    .then((countryId) => {
      return citiesTable
        .where(`{Name} = "${cityName}"`)
        .then((records) => {
          if (records.length) {
            return Promise.reject(`City ${cityName } exists`);
          }
          return citiesTable.create({
            Name: cityName,
            Country: [countryId]
          });
        });
    })
    .then((record) => winston.info(`Created City: ${record.getId()} | ${record.get('Name')}`))
    .catch(winston.err);
});

const processDiff = ((rawDiff = '') => {
  let extracted = extractDiff(rawDiff);

  if (isNil(extracted)) {
    winston.warn('Could not extract from diff');
    return;
  }

  return extracted.forEach((addition) => {
    let [companyAndUrl, location, description] = addition
      .split('|')
      .map((s) => s.trim());
    let extractedCompany = extractCompanyName(companyAndUrl);
    let extractedUrl = extractUrl(companyAndUrl);
    let shouldProcess = every([extractedCompany, extractedUrl, location, description], Boolean);

    if (!shouldProcess) {
      return;
    }

    winston.info(`Extracting ${location} to Airtable...`);
    extractLocation(location);

    winston.info(`Adding ${extractedCompany} to Airtable...`);
    let rawTable = new Table('Raw');
    rawTable.create({
      Company: extractedCompany,
      URL: extractedUrl,
      Location: location,
      Description: description
    })
    .then((record) => winston.info(`Created Raw: ${record.getId()} | ${record.get('Company')}`))
    .catch(winston.err);
  });
});

module.exports = processDiff;