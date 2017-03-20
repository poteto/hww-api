const winston = require('winston');
const lang = require('lodash/lang');
const collection = require('lodash/collection');
const inflection = require('inflection');
const retext = require('retext');
const nlcstToString = require('nlcst-to-string');
const keywords = require('retext-keywords');

const lookupLocation = require('./lookup-location');
const Table = require('./table');

const { isNil } = lang;
const { reject } = collection;

/**
 * Splits and trims a string.
 *
 * @param {String} link
 * @param {String|RegExp} splitter
 */
const splitAndTrim = (link, splitter) => {
  return link
    .split(splitter)
    .map((s) => s.trim());
}

/**
 * Extracts link text from a markdown formatted string.
 *
 * @param {String} str
 * @returns {String}
 */
const extractCompanyName = (str = '') => {
  let [matched] = str.match(/\[(.*?)\]/g) || [];
  if (isNil(matched)) {
    return;
  }
  return matched.substring(1, matched.length - 1);
};

/**
 * Extracts URL from a markdown formatted string.
 *
 * @param {String} str
 * @returns {String}
 */
const extractUrl = (str = '') => {
  let [matched] = str.match(/\((.*?)\)/g) || [];
  if (isNil(matched)) {
    return;
  }
  return matched.substring(1, matched.length - 1);
};


/**
 * Extract addition contents from a parsed diff.
 *
 * @param {Object} parsedDiff
 * @returns {Array<string>}
 */
const extractDiff = (parsedDiff) => {
  return parsedDiff[0]
    .chunks[0]
    .changes
    .filter((change) => change.type === 'add')
    .map((addition) => addition.content);
};

const extractKeywords = (description) => {
  let promise = new Promise((resolve, reject) => {
    retext().use(keywords).process(description, (err, file) => {
      if (err) {
        return reject(err);
      }
      return resolve(file);
    });
  });

  return promise.then(({ data }) => {
    return data.keywords.map((kw) => {
      let keyword = nlcstToString(kw.matches[0].node);
      let adjusted = keyword
        .toLowerCase()
        .replace(/[^\w\s]+/g, '');
      return inflection.singularize(adjusted);
    });
  });
}

/**
 * From a given string, extract locations, then find or create all locations.
 *
 * @param {String} location
 * @return {Promise} list of location records
 */
const extractLocations = (location) => {
  let locations = reject(splitAndTrim(location, /[;\/\&]/g), (s) => {
    return extractRemoteAvailable(s);
  });
  winston.info(`Parsed locations: ${locations}`);
  return Promise.all(locations.map((location) => {
    return lookupLocation(location)
      .then(({ city, country }) => findOrCreateCity(city.long_name, country.long_name));
  }))
  .catch((err) => winston.error(err));
};

/**
 * From a given string, extract if `Remote` (case-insensitive) is included in
 * the string.
 *
 * @param {String} location
 * @returns {Boolean}
 */
const extractRemoteAvailable = (location) => {
  let remoteRegex = /remote/i;
  let remoteOk = remoteRegex.exec(location);
  return !!remoteOk;
};

/**
 * Find or create a city with a country association.
 *
 * @param {String} cityName
 * @param {String} countryName
 * @returns {Promise}
 */
const findOrCreateCity = (cityName, countryName) => {
  let citiesTable = new Table('Cities');
  let countriesTable = new Table('Countries');

  return countriesTable
    .where(`FIND("${countryName}", {Name})`)
    .then(([record]) => {
      if (isNil(record)) {
        return Promise.reject(`Could not find country ${countryName}, skipping create city ${cityName}`);
      }
      return record.getId();
    })
    .then((countryId) => {
      return citiesTable.findOrCreateBy(`{Name} = "${cityName}"`, {
        'Name': cityName,
        'Country': [countryId]
      });
    })
    .catch((err) => winston.error(err));
};

module.exports = {
  splitAndTrim,
  extractCompanyName,
  extractUrl,
  extractDiff,
  extractLocations,
  extractRemoteAvailable,
  extractKeywords,
  findOrCreateCity
}