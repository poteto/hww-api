const winston = require('winston');
const lang = require('lodash/lang');
const mapsClient = require('@google/maps').createClient({
  Promise,
  key: process.env.GOOGLE_API_KEY
});
const { isNil } = lang;

const lookupLocation = ((cityName) => {
  winston.info(`Fetching location data for ${cityName}`);
  return mapsClient
    .places({ query: cityName })
    .asPromise()
    .then((res) => {
      let { results } = res.json;
      return results
        .filter((result) => result.types.includes('political'))
        .map((result) => result.place_id);
    })
    .then(([placeid]) => mapsClient.place({ placeid }).asPromise())
    .then((res) => {
      let { address_components: addressComponents = [] } = res.json.result;
      let country = addressComponents.find((address) => address.types.includes('country'));
      let city = addressComponents.find((address) => address.types.includes('locality'));
      if (isNil(city) || isNil(country)) {
        return Promise.reject(`Could not fetch location data for ${cityName}`);
      }
      winston.info(`Found location data for ${cityName}`);
      return { city, country };
    })
    .catch((err) => winston.error(err));
});

module.exports = lookupLocation;